import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  district: string;
  village: string;
  bio: string;
  avatarUrl: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Story {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  title: string;
  description: string;
  fullText: string;
  contentType: 'text' | 'audio' | 'document';
  audioUrl?: string;
  coverImageUrl?: string;
  originalTranscript?: string;
  correctedTranscript?: string;
  district: string;
  village: string;
  category: string;
  sourceCitation: string;
  originalPeriod: string;
  contributorName: string;
  verificationType: 'historical_record' | 'oral_tradition' | 'personal_memory' | 'demonstration';
  visibility: 'public' | 'draft';
  isReported?: boolean;
  isHidden?: boolean;
  likesCount: number;
  viewsCount: number;
  copyrightConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  storyId: string;
  createdAt: string;
}

export interface Like {
  id: string;
  userId: string;
  storyId: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  storyId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Report {
  id: string;
  storyId: string;
  storyTitle: string;
  reportedByUserId?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
}

export interface DatabaseSchema {
  users: User[];
  stories: Story[];
  bookmarks: Bookmark[];
  likes: Like[];
  comments: Comment[];
  reports: Report[];
  sessions: { token: string; userId: string; expiresAt: string }[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'ninaivosai_db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(hash, 'hex'));
}

const INITIAL_DEMO_STORIES: Story[] = [
  {
    id: 'story-demo-1',
    ownerId: 'user-demo-admin',
    ownerName: 'முத்துவேல் பாண்டியன்',
    ownerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    title: 'மதுரை சித்திரைத் திருவிழா: வைகை ஆற்றில் கள்ளழகர் இறங்கும் ஐதீகமும் வாய்மொழி வரலாறும்',
    description: 'தலைமுறை தலைமுறையாக மதுரை மக்களால் வாய்மொழியாகப் பேணப்பட்டு வரும் அழகர் ஆற்றுத் திருவிழா நிகழ்வுகளும், மண்டூக மகரிஷி சாப விமோசன மரபுக் கதையும்.',
    fullText: `மதுரை மண்ணில் சித்திரைத் திருவிழா என்பது வெறும் சடங்கு மட்டுமல்ல; அது மக்கள் பண்பாட்டின் ஆழமான சங்கமம். சித்ரா பவுர்ணமி நன்னாளில் தங்கக் குதிரை வாகனத்தில் அழகர்மலையிலிருந்து மதுரை நோக்கிப் புறப்படும் கள்ளழகர், வைகை ஆற்றில் எழுந்தருளும் காட்சி நூற்றாண்டு கால வரலாற்று சான்றாகும்.

எங்கள் பாட்டனார் சொல்லக் கேட்ட கதை இது: மண்டூக மகரிஷி பெற்ற சாபத்தை நீக்க அழகர் பெருமான் வைகை நதிக்கரைக்கு எழுந்தருளினார் என்பது மரபு. அதேவேளையில், சைவம் மற்றும் வைணவப் பிரிவுகளிடையே ஒற்றுமையை நிலைநாட்ட மன்னர் திருமலை நாயக்கர் ஆட்சிக் காலத்தில் மீனாட்சி அம்மன் திருக்கல்யாணமும் அழகர் ஆற்றில் இறங்கும் விழாவும் ஒரே பெருவிழாவாக இணைக்கப்பட்ட வாய்மொழி சான்றுகள் இங்குண்டு.

ஆற்றில் இறங்கும் தருணத்தில் ஆயிரக்கணக்கான பக்தர்கள் துளசி தீர்த்தமும், சர்க்கரை பிரசாதமும் ஏந்தி, "கோவிந்தா... அழகர் கோவிந்தா..." என விண்ணதிர முழங்குவார்கள். தண்ணீரைத் தோல் பைகளில் சுமந்து அழகர் மீது தெளித்து வெப்பத்தைத் தணிக்கும் விரதமும், வைகை நதியின் நீரோட்டப் பெருமையும் தமிழர்களின் இயற்கை சார்ந்த வழிபாட்டு முறையை நினைவூட்டுகிறது.`,
    contentType: 'text',
    district: 'மதுரை',
    village: 'ஆல்புகர்புரம் / வைகைக் கரை',
    category: 'திருவிழாக்கள்',
    sourceCitation: 'மதுரை பெரியார்களின் வாய்மொழிப் பகிர்வு மற்றும் களப்பணி ஆவணம்',
    originalPeriod: '17-ஆம் நூற்றாண்டு முதல் தற்காலம் வரை',
    contributorName: 'முத்துவேல் பாண்டியன்',
    verificationType: 'historical_record',
    visibility: 'public',
    likesCount: 24,
    viewsCount: 182,
    copyrightConfirmed: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2026-09-12T10:30:00.000Z',
    updatedAt: '2026-09-12T10:30:00.000Z'
  },
  {
    id: 'story-demo-2',
    ownerId: 'user-demo-admin',
    ownerName: 'மாரிமுத்து அம்மாள்',
    ownerAvatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=256&q=80',
    title: 'கொங்கு நாட்டு பாரம்பரிய உழவு அறிவும், நவதானிய விதை சேமிப்பு முறையும்',
    description: 'விவசாயத்தில் பூச்சிக்கொல்லிகள் இல்லாத காலத்தில் நாட்டு விதைகளை மூங்கில் கூடைகளிலும் மண்பானைகளிலும் வேப்பிலையிட்டுப் பாதுகாத்த முதியவர்களின் வேளாண் அறிவு.',
    fullText: `பழங்காலத்தில் கொங்குப் பகுதியில் வானம் பார்த்த பூமியில் பயிர் செய்த எங்கள் முன்னோர்கள், அடுத்த பருவத்திற்கான விதைகளைத் தெய்வம்போல் பாதுகாத்தார்கள். கம்பு, சோளம், தினை, சாமை, வரகு, குதிரைவாலி, பாசிப்பயறு போன்ற தானியங்களை முற்றி அறுவடை செய்தவுடன், நல்ல திரட்சியான கதிர்களைத் தனியாகப் பிரித்து எடுப்பார்கள்.

விதை நெல்லையும் தானியங்களையும் வேப்பிலை, வசம்பு, வரட்டுக் காய்ந்த சாம்பல் கலந்து மண்பானைகளில் இட்டு, அதன் வாயைச் சிவப்புத் துணியால் கட்டிப் பூசி வைப்பார்கள். பூச்சிகள் ஒருபோதும் அந்த விதைகளை அண்டாது. விதைக்கும் முன் நிலத்தை மூன்று முறை உழுது, மாட்டு எருவும் ஆட்டுக்கிடையும் கட்டி மண்ணின் சத்தை வளர்ப்பார்கள்.

"மழை பெய்யும் ஆனி மாசத்தில் விதைத்தால், கார்த்திகையில் களஞ்சியம் நிறையும்" என்ற பழமொழியை எங்கள் தாத்தா அடிக்கடி சொல்வார். இந்நாளில் ஹைபிரிட் விதைகளின் வருகையால் மறைந்துபோன இந்த மரபு அறிவை நம் பிள்ளைகள் அறிந்து கொள்ள வேண்டும்.`,
    contentType: 'text',
    district: 'கோயம்புத்தூர்',
    village: 'பொள்ளாச்சி அருகே ஆனைமலை',
    category: 'விவசாய அறிவு',
    sourceCitation: 'பொள்ளாச்சி உழவர் பெருமக்களின் வாய்மொழிப் பகிர்வு',
    originalPeriod: '1950-1980 காலகட்டம்',
    contributorName: 'மாரிமுத்து அம்மாள்',
    verificationType: 'oral_tradition',
    visibility: 'public',
    likesCount: 19,
    viewsCount: 145,
    copyrightConfirmed: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2026-09-20T14:15:00.000Z',
    updatedAt: '2026-09-20T14:15:00.000Z'
  },
  {
    id: 'story-demo-3',
    ownerId: 'user-demo-admin',
    ownerName: 'தங்கவேல் நாடார்',
    ownerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    title: 'கன்னியாகுமரி வில்லுப்பாட்டு: உடுக்கையும் வில்லும் ஒலித்த நள்ளிரவுக் கதைகள்',
    description: 'தென் திருவிதாங்கூர் மற்றும் நாஞ்சில் நாட்டின் கிராமக் கோவில் கொடை விழாக்களில் விடிய விடியப் பாடப்பட்ட வில்லுப்பாட்டு மரபும் கலைஞர்களின் வாழ்க்கை அனுபவமும்.',
    fullText: `வில்லுப்பாட்டு என்பது எங்கள் நாஞ்சில் நாட்டின் ஆன்மா. வில்லின் நாணில் வெண்கல மணிகளைக் கட்டி, உடுக்கடி தாளத்தோடு பாடகர் கதையைத் தொடங்கும் போது ஊரே அமைதியாகிவிடும். மாடன் கதை, சுடலைமாடன் வரலாறு, சாஸ்தா கதை போன்ற உள்ளூர்க் கதைகளை விறுவிறுப்பாகப் பாடுவார்கள்.

முதன்மைக் கலைஞர் கையில் வீசுகோல் ஏந்தி வில்லின் நாணைத் தட்டுவார். துணைப் பாடகர்கள் "ஆமாம்... அப்புறம் என்னாச்சு?" என்று கேட்கும் 'பின்பாட்டு' முறை கேட்போரை ஈர்க்கும். இரவு பத்து மணிக்குத் தொடங்கும் வில்லுப்பாட்டு அதிகாலை நான்கு மணிக்குத்தான் முடியும். 

இந்தக் கலையில் வீரமும், கருணையும், ஆன்மிகமும் விரவி இருக்கும். கிராமத்துக் குடும்பங்கள் அனைவரும் பாய் விரித்து அமர்ந்து விடியும் வரை கதை கேட்டு மகிழ்ந்த அந்த நாட்கள் இன்றைய மின்னணு யுகத்தில் அருகி வருவது வேதனைக்குரியது.`,
    contentType: 'audio',
    audioUrl: '',
    originalTranscript: 'வில்லுப்பாட்டு என்பது எங்கள் நாஞ்சில் நாட்டின் ஆன்மா. வில்லின் நாணில் வெண்கல மணிகளைக் கட்டி, உடுக்கடி தாளத்தோடு பாடகர் கதையைத் தொடங்கும் போது ஊரே அமைதியாகிவிடும்.',
    correctedTranscript: 'வில்லுப்பாட்டு என்பது எங்கள் நாஞ்சில் நாட்டின் ஆன்மா. வில்லின் நாணில் வெண்கல மணிகளைக் கட்டி, உடுக்கடி தாளத்தோடு பாடகர் கதையைத் தொடங்கும் போது ஊரே அமைதியாகிவிடும்.',
    district: 'கன்னியாகுமரி',
    village: 'சுசீந்திரம்',
    category: 'பாரம்பரியக் கலைகள்',
    sourceCitation: 'நாஞ்சில் வில்லிசைக் கலைஞர்களின் நேரடி நேர்காணல்',
    originalPeriod: '1970-களின் கலை மரபு',
    contributorName: 'தங்கவேல் நாடார்',
    verificationType: 'oral_tradition',
    visibility: 'public',
    likesCount: 31,
    viewsCount: 210,
    copyrightConfirmed: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z'
  },
  {
    id: 'story-demo-4',
    ownerId: 'user-demo-admin',
    ownerName: 'மீனாட்சி ஆச்சி',
    ownerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    title: 'செட்டிநாட்டு விருந்தோம்பலும், கைமணக்கும் கல் உரல் மசாலா இரகசியங்களும்',
    description: 'எந்திரங்கள் இல்லாத காலத்தில் ஆட்டுக்கல் மற்றும் அம்மியில் அரைத்துச் சமைத்த பாரம்பரியக் குழம்பு வகைகள், விருந்தோம்பல் நெறிகள் மற்றும் கவினி அரிசி இனிப்பு.',
    fullText: `செட்டிநாட்டில் விருந்து என்பது சமைப்பதோடு நின்றுவிடாது; பரிமாறுவதிலும் அன்பு செலுத்துவதிலும் தான் அதன் பெருமை அடங்கியிருக்கிறது. வாழை இலையின் நுனி இடதுபுறம் வர வேண்டும். முதலில் உப்பு, ஊறுகாய், பின்னர் கூட்டு, பொரியல், இறுதியாகத்தான் சோறும் குழம்பும்.

எங்கள் ஆச்சி காலத்தில் மிளகாய், மல்லி, மிளகு, சீரகம், சோம்பு ஆகியவற்றை வறுத்து அம்மியில் தண்ணீர் தெளித்து நைசாக அரைப்பார்கள். மின்சார மிக்சியில் அரைத்தால் அந்தச் சுவையும் நறுமணமும் கிடைக்காது. செட்டிநாட்டுக் காரக்குழம்பும், நாட்டுக்கோழிச் சாறும் மண் சட்டியில் வெந்து மணக்கும் போது தெருவே மணக்கும்.

விருந்துக்கு வரும் எந்த மனிதரையும் முகம் சுளிக்காமல், "சாப்பிட்டுப் போங்க தம்பி" என்று உபசரிப்பது எங்கள் ஊர் வழக்கம். உணவு என்பது உடலுக்கு மட்டுமல்ல, மனித உறவுகளைப் பிணைக்கும் புனிதப் பாலம்.`,
    contentType: 'text',
    district: 'சிவகங்கை',
    village: 'கானாடுகாத்தான்',
    category: 'உணவு மரபுகள்',
    sourceCitation: 'காரைக்குடி குடும்பப் பெரியோர்களின் பகிர்வு',
    originalPeriod: '1960 முதல் இன்று வரை',
    contributorName: 'மீனாட்சி ஆச்சி',
    verificationType: 'personal_memory',
    visibility: 'public',
    likesCount: 28,
    viewsCount: 167,
    copyrightConfirmed: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2026-10-05T16:45:00.000Z',
    updatedAt: '2026-10-05T16:45:00.000Z'
  },
  {
    id: 'story-demo-5',
    ownerId: 'user-demo-admin',
    ownerName: 'கதிரேசன் பிள்ளை',
    ownerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    title: 'தஞ்சை டெல்டாவில் கல்லணைக் கட்டுமானப் பெருமையும் காவிரி நீர்ப் பகிர்வும்',
    description: 'கரிகால் சோழன் கல்லணை கட்டிய தொழில்நுட்ப விந்தைகளும், தலைமுறை தலைமுறையாக விவசாயிகள் கடைப்பிடித்த முறைப்பாசன நீர் பகிர்வு மரபும்.',
    fullText: `காவிரி டெல்டாவின் செழிப்புக்கு அடித்தளமாக விளங்குவது உலகப் புகழ்பெற்ற கல்லணை. மணற்பாங்கான ஆற்றுப் படுகையில் பெரிய பாறைகளை அடுக்கி, களிமண் கலவை கொண்டு இரண்டாயிரம் ஆண்டுகளுக்கு முன்பே கட்டப்பட்ட இக்கட்டடக் கலை அதிசயம் உலகப் பொறியியலாளர்களையே வியப்பில் ஆழ்த்துகிறது.

எங்கள் தஞ்சை கிராமங்களில் நீர் பகிர்வுக்கு ஒரு சிறப்பு முறை உண்டு. அதற்கு "முறைப்பாசனம்" என்று பெயர். தலைமடை விவசாயி குறிப்பிட்ட மணி நேரம் மட்டுமே நீரெடுக்க வேண்டும்; அதன் பின் கடைமடை உழவருக்கு வழிவிட வேண்டும். எவ்வித பூசலும் இன்றி கிராமப் பஞ்சாயத்து இந்த நீர் பங்கீட்டைக் கண்காணிக்கும்.

காவிரியைத் தாயாக வணங்கி, ஆடிப்பெருக்கு நாளில் காதோலை கருகமணி இட்டு நதியை வழிபடும் பழக்கம் நம் மக்களிடையே இயற்கையை நேசிக்கும் உயர்ந்த பண்பாட்டை உணர்த்துகிறது.`,
    contentType: 'text',
    district: 'தஞ்சாவூர்',
    village: 'திருவையாறு அருகே திருக்காட்டுப்பள்ளி',
    category: 'கிராம வரலாறு',
    sourceCitation: 'தஞ்சை பாசன விவசாயிகள் மற்றும் வரலாற்றுப் பதிவுகள்',
    originalPeriod: 'கி.பி. 2-ஆம் நூற்றாண்டு முதல் சமகாலம் வரை',
    contributorName: 'கதிரேசன் பிள்ளை',
    verificationType: 'historical_record',
    visibility: 'public',
    likesCount: 35,
    viewsCount: 240,
    copyrightConfirmed: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2026-10-08T11:20:00.000Z',
    updatedAt: '2026-10-08T11:20:00.000Z'
  },
  {
    id: 'story-demo-6',
    ownerId: 'user-demo-admin',
    ownerName: 'சுப்புலட்சுமி பாட்டி',
    ownerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    title: 'முதியவர்களின் வீட்டு மூலிகை மருத்துவம்: சளி, காய்ச்சலுக்குக் கை கண்ட கைவைத்தியம்',
    description: 'துளசி, ஆடாதோடை, சித்தரத்தை, தூதுவளை இலைகளைக் கசாயம் வைத்து நாள்பட்ட இருமலையும் காய்ச்சலையும் குணப்படுத்திய சித்த மருத்துவ வழிமுறைகள்.',
    fullText: `எங்கள் சிறுவயதில் லேசான சளி, இருமல் வந்தால் உடனே மருத்துவமனைக்கு ஓட மாட்டோம். வீட்டுப் புழக்கடையில் வளரும் துளசி, தூதுவளை, கற்பூரவல்லி, ஆடாதோடை இலைகளைப் பறித்து வந்து நசுக்கி, மிளகு, சீரகம், பனங்கற்கண்டு சேர்த்து கசாயம் வைத்துக் கொடுப்பார்கள்.

வயிற்று வலி என்றால் சுக்கு நீர் அல்லது பெருங்காய நீர் தருவார்கள். அம்மை போட்டால் வேப்பிலையும் மஞ்சள் தண்ணீரும்தான் மூல மருந்து. "உணவே மருந்து; மருந்தே உணவு" என்பது சும்மா சொன்ன வார்த்தை அல்ல; அது தமிழர்களின் அன்றாட வாழ்வியல் நெறி.

இன்றைய தலைமுறையினர் இரசாயன மருந்துகளுக்கு மாறுவதற்கு முன், நம் கொல்லைப்புறத்தில் வளரும் மூலிகைகளின் மகத்துவத்தை அறிந்து கொள்ள வேண்டும் என்று இந்த நினைவுகளைப் பதிவு செய்கிறேன்.`,
    contentType: 'text',
    district: 'திருநெல்வேலி',
    village: 'அம்பாசமுத்திரம்',
    category: 'பாரம்பரிய மருத்துவ அறிவு',
    sourceCitation: 'நெல்லை பாட்டி வைத்தியக் குடும்பக் குறிப்புகள்',
    originalPeriod: '1940-1970',
    contributorName: 'சுப்புலட்சுமி பாட்டி',
    verificationType: 'oral_tradition',
    visibility: 'public',
    likesCount: 42,
    viewsCount: 310,
    copyrightConfirmed: true,
    coverImageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    createdAt: '2026-10-10T09:10:00.000Z',
    updatedAt: '2026-10-10T09:10:00.000Z'
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Database load error, re-initializing:', e);
    }

    const defaultAdminSalt = generateSalt();
    const defaultAdminHash = hashPassword('ninaivou123', defaultAdminSalt);

    const initial: DatabaseSchema = {
      users: [
        {
          id: 'user-demo-admin',
          name: 'தமிழ்ப் பண்பாட்டுப் பெட்டகம்',
          username: 'ninaivosai_admin',
          email: 'admin@ninaivosai.tamizham.org',
          passwordHash: defaultAdminHash,
          salt: defaultAdminSalt,
          district: 'மதுரை',
          village: 'மதுரை மாநகரம்',
          bio: 'தமிழ் வாய்மொழி மரபுகள், பண்பாட்டுக் கதைகள் மற்றும் பாரம்பரிய அறிவைப் பாதுகாக்கும் பொதுக் காப்பகம்.',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ],
      stories: INITIAL_DEMO_STORIES,
      bookmarks: [],
      likes: [],
      comments: [
        {
          id: 'comm-1',
          storyId: 'story-demo-1',
          userId: 'user-demo-admin',
          userName: 'முத்துவேல் பாண்டியன்',
          content: 'இந்த ஐதீகத்தைப் பதிவு செய்தமைக்கு மிக்க நன்றி. எங்கள் ஊர் பெரியவர்கள் சொன்ன பல விவரங்கள் இதில் துல்லியமாக வந்துள்ளன.',
          createdAt: '2026-09-13T12:00:00.000Z'
        }
      ],
      reports: [],
      sessions: []
    };

    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      const target = dataToSave || this.data;
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(target, null, 2), 'utf-8');
      fs.renameSync(tmp, DB_FILE);
    } catch (e) {
      console.error('Database write error:', e);
    }
  }

  // --- Users & Auth ---
  public createUser(userData: {
    name: string;
    username: string;
    email: string;
    passwordPlain: string;
    district?: string;
    village?: string;
    bio?: string;
    avatarUrl?: string;
  }): { user: User; token: string } {
    const existing = this.data.users.find(
      u => u.username.toLowerCase() === userData.username.toLowerCase() ||
           u.email.toLowerCase() === userData.email.toLowerCase()
    );
    if (existing) {
      throw new Error('பயனர் பெயர் அல்லது மின்னஞ்சல் ஏற்கனவே பயன்பாட்டில் உள்ளது.');
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(userData.passwordPlain, salt);
    const user: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: userData.name,
      username: userData.username,
      email: userData.email,
      passwordHash,
      salt,
      district: userData.district || 'மதுரை',
      village: userData.village || '',
      bio: userData.bio || '',
      avatarUrl: userData.avatarUrl || '',
      role: 'user',
      createdAt: new Date().toISOString()
    };

    this.data.users.push(user);

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    this.data.sessions.push({ token, userId: user.id, expiresAt });
    this.save();

    return { user, token };
  }

  public loginUser(credential: string, passwordPlain: string): { user: User; token: string } {
    const user = this.data.users.find(
      u => u.username.toLowerCase() === credential.toLowerCase() ||
           u.email.toLowerCase() === credential.toLowerCase()
    );

    if (!user) {
      throw new Error('பயனர் கணக்கு அல்லது கடவுச்சொல் தவறானது.');
    }

    const valid = verifyPassword(passwordPlain, user.salt, user.passwordHash);
    if (!valid) {
      throw new Error('பயனர் கணக்கு அல்லது கடவுச்சொல் தவறானது.');
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    this.data.sessions.push({ token, userId: user.id, expiresAt });
    this.save();

    return { user, token };
  }

  public getUserByToken(token: string): User | null {
    const session = this.data.sessions.find(s => s.token === token);
    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) return null;
    return this.data.users.find(u => u.id === session.userId) || null;
  }

  public logout(token: string) {
    this.data.sessions = this.data.sessions.filter(s => s.token !== token);
    this.save();
  }

  public updateUserProfile(userId: string, update: Partial<Pick<User, 'name' | 'district' | 'village' | 'bio' | 'avatarUrl'>>): User {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) throw new Error('பயனர் கண்டறியப்படவில்லை.');

    if (update.name) user.name = update.name;
    if (update.district !== undefined) user.district = update.district;
    if (update.village !== undefined) user.village = update.village;
    if (update.bio !== undefined) user.bio = update.bio;
    if (update.avatarUrl !== undefined) user.avatarUrl = update.avatarUrl;

    this.save();
    return user;
  }

  // --- Stories ---
  public getStories(params: {
    search?: string;
    district?: string;
    village?: string;
    category?: string;
    contentType?: string;
    currentUserId?: string;
    page?: number;
    limit?: number;
  }): { stories: Story[]; total: number; page: number; totalPages: number } {
    let list = this.data.stories.filter(s => s.visibility === 'public' && !s.isHidden);

    if (params.search) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.fullText.toLowerCase().includes(q) ||
        (s.originalTranscript && s.originalTranscript.toLowerCase().includes(q)) ||
        (s.correctedTranscript && s.correctedTranscript.toLowerCase().includes(q)) ||
        s.district.toLowerCase().includes(q) ||
        s.village.toLowerCase().includes(q) ||
        s.contributorName.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }

    if (params.district && params.district !== 'அனைத்தும்') {
      list = list.filter(s => s.district === params.district);
    }

    if (params.village) {
      list = list.filter(s => s.village.toLowerCase().includes(params.village!.toLowerCase()));
    }

    if (params.category && params.category !== 'அனைத்தும்') {
      list = list.filter(s => s.category === params.category);
    }

    if (params.contentType && params.contentType !== 'அனைத்தும்') {
      list = list.filter(s => s.contentType === params.contentType);
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 10);
    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const sliced = list.slice(start, start + limit);

    return { stories: sliced, total, page, totalPages };
  }

  public getStoryById(id: string, viewerUserId?: string): Story | null {
    const story = this.data.stories.find(s => s.id === id);
    if (!story) return null;

    // Check visibility
    if (story.visibility === 'draft' && story.ownerId !== viewerUserId) {
      const viewer = viewerUserId ? this.data.users.find(u => u.id === viewerUserId) : null;
      if (viewer?.role !== 'admin') {
        return null; // Forbidden
      }
    }

    story.viewsCount = (story.viewsCount || 0) + 1;
    this.save();
    return story;
  }

  public createStory(userId: string, payload: Omit<Story, 'id' | 'ownerId' | 'ownerName' | 'ownerAvatar' | 'likesCount' | 'viewsCount' | 'createdAt' | 'updatedAt'>): Story {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) throw new Error('பயனர் கண்டறியப்படவில்லை.');

    const newStory: Story = {
      ...payload,
      id: `story-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ownerId: user.id,
      ownerName: payload.contributorName || user.name,
      ownerAvatar: user.avatarUrl,
      likesCount: 0,
      viewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.stories.unshift(newStory);
    this.save();
    return newStory;
  }

  public updateStory(storyId: string, userId: string, update: Partial<Story>): Story {
    const story = this.data.stories.find(s => s.id === storyId);
    if (!story) throw new Error('கதை கண்டறியப்படவில்லை.');

    const user = this.data.users.find(u => u.id === userId);
    if (story.ownerId !== userId && user?.role !== 'admin') {
      throw new Error('இக்கதையைத் திருத்த உங்களுக்கு அனுமதி இல்லை.');
    }

    Object.assign(story, update, { updatedAt: new Date().toISOString() });
    this.save();
    return story;
  }

  public deleteStory(storyId: string, userId: string): boolean {
    const storyIndex = this.data.stories.findIndex(s => s.id === storyId);
    if (storyIndex === -1) throw new Error('கதை கண்டறியப்படவில்லை.');

    const story = this.data.stories[storyIndex];
    const user = this.data.users.find(u => u.id === userId);
    if (story.ownerId !== userId && user?.role !== 'admin') {
      throw new Error('இக்கதையை நீக்க உங்களுக்கு அனுமதி இல்லை.');
    }

    this.data.stories.splice(storyIndex, 1);
    // Cleanup related bookmarks and comments
    this.data.bookmarks = this.data.bookmarks.filter(b => b.storyId !== storyId);
    this.data.comments = this.data.comments.filter(c => c.storyId !== storyId);
    this.data.likes = this.data.likes.filter(l => l.storyId !== storyId);
    this.save();
    return true;
  }

  public getUserStories(userId: string): { published: Story[]; drafts: Story[] } {
    const all = this.data.stories.filter(s => s.ownerId === userId);
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return {
      published: all.filter(s => s.visibility === 'public'),
      drafts: all.filter(s => s.visibility === 'draft')
    };
  }

  // --- Bookmarks ---
  public toggleBookmark(userId: string, storyId: string): { bookmarked: boolean } {
    const idx = this.data.bookmarks.findIndex(b => b.userId === userId && b.storyId === storyId);
    if (idx !== -1) {
      this.data.bookmarks.splice(idx, 1);
      this.save();
      return { bookmarked: false };
    } else {
      this.data.bookmarks.push({
        id: `bm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId,
        storyId,
        createdAt: new Date().toISOString()
      });
      this.save();
      return { bookmarked: true };
    }
  }

  public getUserBookmarks(userId: string): Story[] {
    const storyIds = this.data.bookmarks.filter(b => b.userId === userId).map(b => b.storyId);
    return this.data.stories.filter(s => storyIds.includes(s.id) && s.visibility === 'public');
  }

  public isStoryBookmarked(userId: string, storyId: string): boolean {
    return this.data.bookmarks.some(b => b.userId === userId && b.storyId === storyId);
  }

  // --- Likes ---
  public toggleLike(userId: string, storyId: string): { liked: boolean; count: number } {
    const story = this.data.stories.find(s => s.id === storyId);
    if (!story) throw new Error('கதை கண்டறியப்படவில்லை.');

    const idx = this.data.likes.findIndex(l => l.userId === userId && l.storyId === storyId);
    let liked = false;
    if (idx !== -1) {
      this.data.likes.splice(idx, 1);
      story.likesCount = Math.max(0, (story.likesCount || 0) - 1);
      liked = false;
    } else {
      this.data.likes.push({
        id: `like-${Date.now()}`,
        userId,
        storyId,
        createdAt: new Date().toISOString()
      });
      story.likesCount = (story.likesCount || 0) + 1;
      liked = true;
    }
    this.save();
    return { liked, count: story.likesCount };
  }

  public isStoryLiked(userId: string, storyId: string): boolean {
    return this.data.likes.some(l => l.userId === userId && l.storyId === storyId);
  }

  // --- Comments ---
  public getComments(storyId: string): Comment[] {
    return this.data.comments
      .filter(c => c.storyId === storyId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addComment(storyId: string, userId: string, content: string): Comment {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) throw new Error('பயனர் கண்டறியப்படவில்லை.');

    const comment: Comment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      storyId,
      userId,
      userName: user.name,
      userAvatar: user.avatarUrl,
      content,
      createdAt: new Date().toISOString()
    };

    this.data.comments.push(comment);
    this.save();
    return comment;
  }

  // --- Reports & Moderation ---
  public reportStory(storyId: string, reason: string, details?: string, userId?: string): Report {
    const story = this.data.stories.find(s => s.id === storyId);
    if (!story) throw new Error('கதை கண்டறியப்படவில்லை.');

    const report: Report = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      storyId,
      storyTitle: story.title,
      reportedByUserId: userId,
      reason,
      details,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    story.isReported = true;
    this.data.reports.unshift(report);
    this.save();
    return report;
  }

  public getReports(): Report[] {
    return this.data.reports;
  }

  public moderateStory(reportId: string, action: 'hide' | 'unhide' | 'dismiss'): boolean {
    const report = this.data.reports.find(r => r.id === reportId);
    if (!report) return false;

    const story = this.data.stories.find(s => s.id === report.storyId);
    if (action === 'hide' && story) {
      story.isHidden = true;
      report.status = 'reviewed';
    } else if (action === 'unhide' && story) {
      story.isHidden = false;
      report.status = 'reviewed';
    } else if (action === 'dismiss') {
      report.status = 'dismissed';
    }

    this.save();
    return true;
  }

  // --- Regional Statistics ---
  public getDistrictStats(): { district: string; count: number; villages: string[] }[] {
    const map = new Map<string, { count: number; villages: Set<string> }>();

    for (const story of this.data.stories) {
      if (story.visibility !== 'public' || story.isHidden) continue;
      const d = story.district || 'பிற';
      if (!map.has(d)) {
        map.set(d, { count: 0, villages: new Set<string>() });
      }
      const entry = map.get(d)!;
      entry.count += 1;
      if (story.village) {
        entry.villages.add(story.village);
      }
    }

    return Array.from(map.entries()).map(([district, data]) => ({
      district,
      count: data.count,
      villages: Array.from(data.villages)
    })).sort((a, b) => b.count - a.count);
  }
}

export const db = new Database();
