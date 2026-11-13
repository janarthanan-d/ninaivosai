import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { db, User } from './server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Setup directories
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const AUDIO_DIR = path.resolve(UPLOADS_DIR, 'audio');
const IMAGES_DIR = path.resolve(UPLOADS_DIR, 'images');
const DOCS_DIR = path.resolve(UPLOADS_DIR, 'docs');

[UPLOADS_DIR, AUDIO_DIR, IMAGES_DIR, DOCS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Multer Storage Configuration
const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AUDIO_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase() || '.mp3';
    cb(null, `audio-${uniqueSuffix}${ext}`);
  },
});

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMAGES_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `img-${uniqueSuffix}${ext}`);
  },
});

const docStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DOCS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase() || '.txt';
    cb(null, `doc-${uniqueSuffix}${ext}`);
  },
});

const audioUpload = multer({
  storage: audioStorage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/x-m4a', 'audio/webm', 'audio/ogg', 'audio/aac'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|m4a|webm|ogg|aac)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('ஆதரிக்கப்படாத ஒலி வடிவமைப்பு. MP3, WAV, M4A, அல்லது WEBM கோப்புகளைப் பயன்படுத்தவும்.'));
    }
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('ஆதரிக்கப்படாத பட வடிவம். JPG, PNG அல்லது WebP படங்களை மட்டுமே பதிவேற்றவும்.'));
    }
  },
});

const docUpload = multer({
  storage: docStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/plain' || file.mimetype === 'application/pdf' || file.originalname.match(/\.(txt|pdf)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('TXT அல்லது PDF ஆவணங்களை மட்டுமே பதிவேற்ற முடியும்.'));
    }
  },
});

// Authentication middleware
interface AuthenticatedRequest extends Request {
  user?: User;
}

const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'செயல்பாட்டிற்குப் பயனர் உள்நுழைவு அவசியம்.' });
  }

  const token = authHeader.split(' ')[1];
  const user = db.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'பயனர் அமர்வு முடிவடைந்தது. மீண்டும் உள்நுழையவும்.' });
  }

  req.user = user;
  next();
};

const optionalAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = db.getUserByToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
};

// ================= API ROUTES =================

// 1. Auth routes
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, username, email, password, district, village, bio } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: 'அனைத்து கட்டாய விவரங்களையும் பூர்த்தி செய்க.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'கடவுச்சொல் குறைந்தது 6 எழுத்துகள் கொண்டிருக்க வேண்டும்.' });
    }

    const result = db.createUser({
      name,
      username,
      email,
      passwordPlain: password,
      district,
      village,
      bio,
    });

    const { passwordHash, salt, ...safeUser } = result.user;
    return res.status(201).json({ user: safeUser, token: result.token });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'பதிவு செய்வதில் பிழை ஏற்பட்டது.' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { credential, password } = req.body;
    if (!credential || !password) {
      return res.status(400).json({ error: 'பயனர் பெயர் மற்றும் கடவுச்சொல்லை உள்ளிடவும்.' });
    }

    const result = db.loginUser(credential, password);
    const { passwordHash, salt, ...safeUser } = result.user;
    return res.json({ user: safeUser, token: result.token });
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'உள்நுழைவு தோல்வியடைந்தது.' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { passwordHash, salt, ...safeUser } = req.user!;
  return res.json({ user: safeUser });
});

app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const token = req.headers.authorization!.split(' ')[1];
  db.logout(token);
  return res.json({ message: 'வெற்றிகரமாக வெளியேறினீர்கள்.' });
});

app.put('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, district, village, bio, avatarUrl } = req.body;
    const updated = db.updateUserProfile(req.user!.id, { name, district, village, bio, avatarUrl });
    const { passwordHash, salt, ...safeUser } = updated;
    return res.json({ user: safeUser });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'சுயவிவரத்தைப் புதுப்பிப்பதில் பிழை.' });
  }
});

// Password recovery mock endpoint
app.post('/api/auth/recover', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'மின்னஞ்சல் முகவரியை உள்ளிடவும்.' });
  }
  // Safe user feedback in Tamil
  return res.json({
    message: 'உங்கள் மின்னஞ்சல் முகவரிக்குக் கடவுச்சொல் மீட்பு வழிமுறைகள் அனுப்பப்பட்டுள்ளன.',
  });
});

// 2. Stories routes
app.get('/api/stories', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, district, village, category, contentType, page, limit } = req.query;
    const result = db.getStories({
      search: search as string,
      district: district as string,
      village: village as string,
      category: category as string,
      contentType: contentType as string,
      currentUserId: req.user?.id,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
    });

    const enrichedStories = result.stories.map(story => ({
      ...story,
      isBookmarked: req.user ? db.isStoryBookmarked(req.user.id, story.id) : false,
      isLiked: req.user ? db.isStoryLiked(req.user.id, story.id) : false,
    }));

    return res.json({ ...result, stories: enrichedStories });
  } catch (err: any) {
    return res.status(500).json({ error: 'கதைகளைப் பெறுவதில் பிழை ஏற்பட்டது.' });
  }
});

app.get('/api/stories/:id', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const story = db.getStoryById(req.params.id, req.user?.id);
    if (!story) {
      return res.status(404).json({ error: 'கதை கண்டறியப்படவில்லை அல்லது தனிப்பட்ட வரைவாக உள்ளது.' });
    }

    const comments = db.getComments(story.id);
    const isBookmarked = req.user ? db.isStoryBookmarked(req.user.id, story.id) : false;
    const isLiked = req.user ? db.isStoryLiked(req.user.id, story.id) : false;

    return res.json({
      story: {
        ...story,
        isBookmarked,
        isLiked,
      },
      comments,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'கதையைப் பெறுவதில் பிழை ஏற்பட்டது.' });
  }
});

app.post('/api/stories', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      fullText,
      contentType,
      audioUrl,
      coverImageUrl,
      originalTranscript,
      correctedTranscript,
      district,
      village,
      category,
      sourceCitation,
      originalPeriod,
      contributorName,
      verificationType,
      visibility,
      copyrightConfirmed,
    } = req.body;

    if (!title || !fullText) {
      return res.status(400).json({ error: 'கதையின் தலைப்பு மற்றும் முழு உரை கட்டாயமாகும்.' });
    }

    if (!district || !category) {
      return res.status(400).json({ error: 'மாவட்டம் மற்றும் தலைப்பு வகையைத் தேர்ந்தெடுக்கவும்.' });
    }

    if (!copyrightConfirmed) {
      return res.status(400).json({ error: 'உரிமம் மற்றும் பகிர்வு ஒப்புதலை உறுதிப்படுத்த வேண்டும்.' });
    }

    const story = db.createStory(req.user!.id, {
      title,
      description: description || fullText.slice(0, 150) + '...',
      fullText,
      contentType: contentType || 'text',
      audioUrl: audioUrl || '',
      coverImageUrl: coverImageUrl || '',
      originalTranscript: originalTranscript || '',
      correctedTranscript: correctedTranscript || '',
      district,
      village: village || '',
      category,
      sourceCitation: sourceCitation || '',
      originalPeriod: originalPeriod || '',
      contributorName: contributorName || req.user!.name,
      verificationType: verificationType || 'personal_memory',
      visibility: visibility || 'public',
      copyrightConfirmed: true,
    });

    return res.status(201).json({ story });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'கதையைப் பதிவு செய்வதில் பிழை ஏற்பட்டது.' });
  }
});

app.put('/api/stories/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const story = db.updateStory(req.params.id, req.user!.id, req.body);
    return res.json({ story });
  } catch (err: any) {
    return res.status(403).json({ error: err.message || 'கதையைத் திருத்த அனுமதி இல்லை.' });
  }
});

app.delete('/api/stories/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    db.deleteStory(req.params.id, req.user!.id);
    return res.json({ message: 'கதை வெற்றிகரமாக நீக்கப்பட்டது.' });
  } catch (err: any) {
    return res.status(403).json({ error: err.message || 'கதையை நீக்க அனுமதி இல்லை.' });
  }
});

// Bookmarks & Likes
app.post('/api/stories/:id/bookmark', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = db.toggleBookmark(req.user!.id, req.params.id);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: 'சேமிப்பதில் பிழை ஏற்பட்டது.' });
  }
});

app.post('/api/stories/:id/like', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = db.toggleLike(req.user!.id, req.params.id);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: 'விருப்பம் தெரிவிப்பதில் பிழை ஏற்பட்டது.' });
  }
});

app.get('/api/user/bookmarks', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const bookmarks = db.getUserBookmarks(req.user!.id);
  return res.json({ stories: bookmarks });
});

app.get('/api/user/my-stories', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userStories = db.getUserStories(req.user!.id);
  return res.json(userStories);
});

// Comments
app.post('/api/stories/:id/comments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'கருத்து உரையை உள்ளிடவும்.' });
    }
    const comment = db.addComment(req.params.id, req.user!.id, content.trim());
    return res.status(201).json({ comment });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'கருத்தைப் பதிவிடுவதில் பிழை.' });
  }
});

// Reports & Moderation
app.post('/api/stories/:id/report', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reason, details } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'புகாருக்கான காரணத்தைத் தேர்ந்தெடுக்கவும்.' });
    }
    const report = db.reportStory(req.params.id, reason, details, req.user?.id);
    return res.status(201).json({
      message: 'உங்கள் புகார் பெறப்பட்டது. நிர்வாகக் குழு இதை ஆய்வு செய்து தகுந்த நடவடிக்கை எடுக்கும்.',
      report,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'புகார் பதிவு செய்வதில் பிழை.' });
  }
});

app.get('/api/admin/reports', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'நிர்வாகிகளுக்கு மட்டுமே அனுமதி உண்டு.' });
  }
  const reports = db.getReports();
  return res.json({ reports });
});

app.post('/api/admin/moderate', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ error: 'நிர்வாகிகளுக்கு மட்டுமே அனுமதி உண்டு.' });
  }
  const { reportId, action } = req.body;
  const ok = db.moderateStory(reportId, action);
  return res.json({ success: ok, message: 'நடவடிக்கை வெற்றிகரமாகப் பதிவு செய்யப்பட்டது.' });
});

// Regional statistics
app.get('/api/districts/stats', (_req: Request, res: Response) => {
  const stats = db.getDistrictStats();
  return res.json({ stats });
});

// 3. File Upload endpoints
app.post('/api/upload/audio', (req: Request, res: Response) => {
  audioUpload.single('audio')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'ஒலிக் கோப்புப் பதிவேற்றம் தோல்வியடைந்தது.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'ஒலிக் கோப்பைத் தேர்ந்தெடுக்கவும்.' });
    }
    const audioUrl = `/uploads/audio/${req.file.filename}`;
    return res.json({
      audioUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      message: 'ஒலிக் கோப்பு வெற்றிகரமாகப் பதிவேற்றப்பட்டது.',
    });
  });
});

app.post('/api/upload/image', (req: Request, res: Response) => {
  imageUpload.single('image')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'படப் பதிவேற்றம் தோல்வியடைந்தது.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'படக் கோப்பைத் தேர்ந்தெடுக்கவும்.' });
    }
    const imageUrl = `/uploads/images/${req.file.filename}`;
    return res.json({
      imageUrl,
      filename: req.file.filename,
      message: 'படம் வெற்றிகரமாகப் பதிவேற்றப்பட்டது.',
    });
  });
});

// Document text extraction endpoint
app.post('/api/extract-text', (req: Request, res: Response) => {
  docUpload.single('doc')(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'ஆவணப் பதிவேற்றம் தோல்வியடைந்தது.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'ஆவணக் கோப்பைத் தேர்ந்தெடுக்கவும்.' });
    }

    try {
      const filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();

      if (ext === '.txt') {
        const text = fs.readFileSync(filePath, 'utf-8');
        return res.json({
          extractedText: text.trim(),
          filename: req.file.originalname,
          message: 'உரை ஆவணத்திலிருந்து வெற்றிகரமாகப் பிரித்தெடுக்கப்பட்டது.',
        });
      } else if (ext === '.pdf') {
        const buffer = fs.readFileSync(filePath);
        const rawContent = buffer.toString('latin1');
        // Simple extraction of printable text streams from standard text-based PDFs
        const textMatches: string[] = [];
        const streamRegex = /BT[\s\S]*?ET/g;
        let match;
        while ((match = streamRegex.exec(rawContent)) !== null) {
          const inner = match[0];
          const stringRegex = /\(([^)]+)\)/g;
          let strMatch;
          while ((strMatch = stringRegex.exec(inner)) !== null) {
            textMatches.push(strMatch[1]);
          }
        }

        const combined = textMatches.join(' ').replace(/\\([()\\])/g, '$1').trim();

        if (combined.length > 30) {
          return res.json({
            extractedText: combined,
            filename: req.file.originalname,
            message: 'PDF ஆவணத்திலிருந்து உரை பிரித்தெடுக்கப்பட்டது.',
          });
        } else {
          // If binary or scanned PDF without native stream text
          return res.status(422).json({
            error: 'இந்த PDF கோப்பில் நேரடியாகப் படிக்கக்கூடிய உரை இல்லை. ஸ்கேன் செய்யப்பட்ட ஆவணங்களை உரை (.txt) வடிவத்திற்கு மாற்றிப் பதிவேற்றவும்.',
          });
        }
      }

      return res.status(400).json({ error: 'ஆதரிக்கப்படாத ஆவண வடிவம்.' });
    } catch (e: any) {
      return res.status(500).json({ error: 'ஆவணத்திலிருந்து உரையைப் பிரித்தெடுப்பதில் பிழை ஏற்பட்டது.' });
    }
  });
});

// 4. Tamil Speech-to-Text via Gemini (gemini-3.5-transcribe)
app.post('/api/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioUrl, base64Audio, mimeType } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'ஒலி உரைமாற்றச் சேவைக்கான சான்றுகள் கட்டமைக்கப்படவில்லை. தயவுசெய்து உங்கள் கதையை எழுத்து வடிவில் நேரடியாக உள்ளிடவும்.',
      });
    }

    let audioData = base64Audio;
    let actualMime = mimeType || 'audio/mp3';

    if (!audioData && audioUrl) {
      const cleanPath = audioUrl.replace(/^\/uploads\//, '');
      const fullPath = path.resolve(UPLOADS_DIR, cleanPath);
      if (fs.existsSync(fullPath)) {
        const fileBuf = fs.readFileSync(fullPath);
        audioData = fileBuf.toString('base64');
        const ext = path.extname(fullPath).toLowerCase();
        if (ext === '.wav') actualMime = 'audio/wav';
        else if (ext === '.m4a') actualMime = 'audio/m4a';
        else if (ext === '.webm') actualMime = 'audio/webm';
        else actualMime = 'audio/mp3';
      }
    }

    if (!audioData) {
      return res.status(400).json({ error: 'உரைமாற்றத்திற்கான ஒலிக் கோப்பு கிடைக்கவில்லை.' });
    }

    const audioPart = {
      inlineData: {
        mimeType: actualMime,
        data: audioData,
      },
    };

    const promptText = `நீங்கள் தமிழ் வாய்மொழி வரலாற்று ஆவணக் காப்பகத்தின் துல்லியமான ஒலிபெயர்ப்பாளர்.
இந்த ஆடியோவில் உள்ள தமிழ் உரையை எவ்வித ஆங்கில மொழிபெயர்ப்பும் இன்றி, துல்லியமான தூய தமிழ் எழுத்துகளில் (Tamil Unicode script) மட்டுமே ஒலிபெயர்த்துத் தருக.
வட்டார வழக்குச் சொற்கள், கிராமத்துப் பெயர்கள், மனிதர்களின் பெயர்கள், பேச்சு வழக்கு உவமைகள் எதையும் மாற்றாமல், பேசியவாறே பத்திகளாகத் தருக.
கூடுதல் முன்னுரையோ, விளக்கவுரையோ வேண்டாம். தமிழ்ப் பேச்சு உரையை மட்டுமே தருக.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [audioPart, { text: promptText }],
      },
    });

    const transcribedText = response.text?.trim() || '';

    if (!transcribedText) {
      return res.status(422).json({
        error: 'ஒலிக் கோப்பிலிருந்து பேச்சைத் துல்லியமாக அடையாளம் காண முடியவில்லை. சத்தமில்லாத தெளிவான பதிவை மீண்டும் முயற்சிக்கவும்.',
      });
    }

    return res.json({
      transcript: transcribedText,
      message: 'ஒலி வெற்றிகரமாக உரையாக மாற்றப்பட்டது.',
    });
  } catch (err: any) {
    console.error('Transcription error:', err);
    return res.status(500).json({
      error: 'ஒலி உரைமாற்றம் செய்யும் போது பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சி செய்யவும் அல்லது கதையை நேரடியாகத் தட்டச்சு செய்யவும்.',
    });
  }
});

// 5. High-Definition Tamil Text-to-Speech via Gemini (gemini-3.8-flash-lite-tts)
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'வாசிப்பதற்கான தமிழ் உரையை வழங்கவும்.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'சேவையகக் குரல் சேவை கட்டமைக்கப்படவில்லை. உலாவியின் சொந்தக் குரல் பயன்படுத்தப்படும்.',
      });
    }

    // Limit chunk to avoid token limits for real-time speech
    const speechChunk = text.trim().slice(0, 700);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: speechChunk,
              speechMetadata: {
                style: 'Clear, dignified, natural Tamil storytelling narration for cultural heritage',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'குரல் ஆடியோ உருவாக்குவதில் பிழை ஏற்பட்டது.' });
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    console.error('TTS error:', err);
    return res.status(500).json({
      error: 'ஒலி வாசிப்புச் சேவையில் பிழை ஏற்பட்டது. உலாவியின் சொந்தக் குரலைப் பயன்படுத்தவும்.',
    });
  }
});

// Serve frontend with Vite in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`நினைவோசை சேவையகம் போர்ட் ${PORT}-ல் இயங்குகிறது...`);
  });
}

startServer().catch(err => {
  console.error('Server startup error:', err);
});
