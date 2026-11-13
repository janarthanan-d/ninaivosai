import React, { useState, useRef } from 'react';
import { Story, ContentType, VerificationType } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { TAMIL_CATEGORIES, TAMIL_DISTRICTS, VERIFICATION_LABELS } from '../constants/tamilData.ts';
import { stt, SpeechRecognitionStatus } from '../services/stt.ts';
import { AudioPlayer } from './AudioPlayer.tsx';
import {
  FileText,
  Volume2,
  BookOpen,
  Upload,
  Sparkles,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  HelpCircle,
  Save,
  Send,
  Mic,
  MicOff,
  Square,
  Radio
} from 'lucide-react';

interface StoryFormProps {
  initialStory?: Story | null;
  initialText?: string;
  initialAudioUrl?: string;
  onSuccess: (story: Story) => void;
  onCancel: () => void;
  onShowToast: (msg: string) => void;
}

export const StoryForm: React.FC<StoryFormProps> = ({
  initialStory,
  initialText,
  initialAudioUrl,
  onSuccess,
  onCancel,
  onShowToast
}) => {
  const { user } = useAuth();

  // Mode: text, audio, document
  const [contentType, setContentType] = useState<ContentType>(
    initialAudioUrl ? 'audio' : (initialStory?.contentType || 'text')
  );

  // Form Fields
  const [title, setTitle] = useState<string>(initialStory?.title || '');
  const [description, setDescription] = useState<string>(initialStory?.description || '');
  const [fullText, setFullText] = useState<string>(initialText || initialStory?.fullText || '');
  const [district, setDistrict] = useState<string>(initialStory?.district || user?.district || 'மதுரை');
  const [village, setVillage] = useState<string>(initialStory?.village || user?.village || '');
  const [category, setCategory] = useState<string>(initialStory?.category || TAMIL_CATEGORIES[0]);
  const [sourceCitation, setSourceCitation] = useState<string>(initialStory?.sourceCitation || '');
  const [originalPeriod, setOriginalPeriod] = useState<string>(initialStory?.originalPeriod || '');
  const [contributorName, setContributorName] = useState<string>(initialStory?.contributorName || user?.name || '');
  const [verificationType, setVerificationType] = useState<VerificationType>(initialStory?.verificationType || 'oral_tradition');
  const [visibility, setVisibility] = useState<'public' | 'draft'>(initialStory?.visibility || 'public');
  const [copyrightConfirmed, setCopyrightConfirmed] = useState<boolean>(initialStory?.copyrightConfirmed || false);
  const [coverImageUrl, setCoverImageUrl] = useState<string>(initialStory?.coverImageUrl || '');

  // Audio & Document specifics
  const [audioUrl, setAudioUrl] = useState<string>(initialAudioUrl || initialStory?.audioUrl || '');
  const [originalTranscript, setOriginalTranscript] = useState<string>(initialStory?.originalTranscript || '');
  const [correctedTranscript, setCorrectedTranscript] = useState<string>(initialStory?.correctedTranscript || '');

  // UI States
  const [isUploadingAudio, setIsUploadingAudio] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isExtractingDoc, setIsExtractingDoc] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Live Microphone Dictation into Story text
  const [isDictatingText, setIsDictatingText] = useState<boolean>(false);

  // Live Audio Recording for Audio Stories
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  // Audio Upload & Real Speech-to-Text Handler
  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAudio(true);
    setErrorMessage(null);
    try {
      const res = await api.uploadAudio(file);
      setAudioUrl(res.audioUrl);
      onShowToast('ஒலிக் கோப்பு வெற்றிகரமாகப் பதிவேற்றப்பட்டது!');
    } catch (err: any) {
      setErrorMessage(err.message || 'ஒலிக் கோப்பைப் பதிவேற்றுவதில் பிழை ஏற்பட்டது.');
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleTranscribeSpeech = async () => {
    if (!audioUrl) {
      setErrorMessage('முதலில் ஓர் ஒலிக் கோப்பைப் பதிவேற்றவும்.');
      return;
    }

    setIsTranscribing(true);
    setErrorMessage(null);
    onShowToast('பேச்சை உரையாக மாற்றுவது தொடங்கப்பட்டது...');

    try {
      const res = await api.transcribeAudio({ audioUrl });
      const text = res.transcript;
      setOriginalTranscript(text);
      setCorrectedTranscript(text);
      if (!fullText) {
        setFullText(text);
      }
      onShowToast('பேச்சு வெற்றிகரமாகத் தமிழ் உரையாக மாற்றப்பட்டது!');
    } catch (err: any) {
      setErrorMessage(err.message || 'ஒலி உரைமாற்றம் செய்வதில் பிழை ஏற்பட்டது.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Live Microphone Dictation Handler (Web Speech API)
  const handleToggleDictation = () => {
    if (isDictatingText) {
      stt.stop();
      setIsDictatingText(false);
      onShowToast('குரல் தட்டச்சு நிறுத்தப்பட்டது.');
    } else {
      setIsDictatingText(true);
      onShowToast('பேசுங்கள்... உரை தட்டச்சாகிறது.');

      stt.start(
        fullText,
        (text: string) => {
          setFullText(text);
          if (contentType === 'audio') {
            setCorrectedTranscript(text);
          }
        },
        (status: SpeechRecognitionStatus) => {
          setIsDictatingText(status.isListening);
          if (status.error) {
            setErrorMessage(status.error);
            setIsDictatingText(false);
          }
        }
      );
    }
  };

  // Direct Live Microphone Recording Handler
  const handleStartLiveRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = e => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());

        // Upload recorded blob to server
        setIsUploadingAudio(true);
        onShowToast('ஒலிப்பதிவு சேமிக்கப்படுகிறது...');
        try {
          const file = new File([audioBlob], `recorded-${Date.now()}.webm`, {
            type: audioBlob.type || 'audio/webm',
          });
          const res = await api.uploadAudio(file);
          setAudioUrl(res.audioUrl);
          onShowToast('ஒலிப்பதிவு வெற்றிகரமாகச் சேமிக்கப்பட்டது!');
        } catch (err: any) {
          setErrorMessage(err.message || 'ஒலிப்பதிவைச் சேமிப்பதில் பிழை.');
        } finally {
          setIsUploadingAudio(false);
        }
      };

      recorder.start(100);
      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      setErrorMessage(null);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);

      onShowToast('ஒலிப்பதிவு தொடங்கப்பட்டது...');
    } catch {
      setErrorMessage('மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது. உலாவியின் அமைப்புகளில் மைக் அனுமதியை வழங்கவும்.');
    }
  };

  const handleStopLiveRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Image Upload Handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const res = await api.uploadImage(file);
      setCoverImageUrl(res.imageUrl);
      onShowToast('கவர் படம் பதிவேற்றப்பட்டது!');
    } catch (err: any) {
      setErrorMessage(err.message || 'படப் பதிவேற்றம் தோல்வியடைந்தது.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Document Text Extraction Handler
  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingDoc(true);
    setErrorMessage(null);
    try {
      const res = await api.extractDocumentText(file);
      setFullText(res.extractedText);
      if (!title) {
        const autoTitle = file.name.replace(/\.[^/.]+$/, '');
        setTitle(autoTitle);
      }
      onShowToast('ஆவணத்திலிருந்து தமிழ் உரை வெற்றிகரமாகப் பிரித்தெடுக்கப்பட்டது!');
    } catch (err: any) {
      setErrorMessage(err.message || 'ஆவணத்திலிருந்து உரையைப் பிரித்தெடுப்பதில் பிழை.');
    } finally {
      setIsExtractingDoc(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (targetVisibility: 'public' | 'draft') => {
    if (!title.trim()) {
      setErrorMessage('கதையின் தலைப்பை உள்ளிடவும்.');
      return;
    }
    if (!fullText.trim()) {
      setErrorMessage('கதையின் முழு உரையை உள்ளிடவும்.');
      return;
    }
    if (!copyrightConfirmed) {
      setErrorMessage('இக்கதையைப் பகிர்வதற்கான உரிமை அல்லது அனுமதி உள்ளதை உறுதிப்படுத்த வேண்டும்.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || fullText.trim().slice(0, 160) + '...',
      fullText: fullText.trim(),
      contentType,
      audioUrl: contentType === 'audio' ? audioUrl : '',
      coverImageUrl,
      originalTranscript,
      correctedTranscript: correctedTranscript || fullText.trim(),
      district,
      village: village.trim(),
      category,
      sourceCitation: sourceCitation.trim(),
      originalPeriod: originalPeriod.trim(),
      contributorName: contributorName.trim() || user?.name || 'பெயரற்றவர்',
      verificationType,
      visibility: targetVisibility,
      copyrightConfirmed: true
    };

    try {
      if (initialStory) {
        const res = await api.updateStory(initialStory.id, payload);
        onShowToast('கதை வெற்றிகரமாகப் புதுப்பிக்கப்பட்டது!');
        onSuccess(res.story);
      } else {
        const res = await api.createStory(payload);
        onShowToast(targetVisibility === 'public' ? 'கதை வெற்றிகரமாக வெளியிடப்பட்டது!' : 'வரைவாகச் சேமிக்கப்பட்டது!');
        onSuccess(res.story);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'கதையைப் பதிவு செய்வதில் பிழை ஏற்பட்டது.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#FAF6EE] border border-[#E8DEC8] rounded-2xl shadow-sm overflow-hidden max-w-4xl mx-auto my-6">
      {/* Form Top Title */}
      <div className="p-4 sm:p-6 border-b border-[#E8DEC8] bg-[#F5EEDB]/60 flex items-center justify-between">
        <div>
          <h2 className="font-['Noto_Serif_Tamil',serif] font-bold text-xl sm:text-2xl text-[#7B1113]">
            {initialStory ? 'கதையைத் திருத்துக' : 'புதிய கதையைப் பகிர்'}
          </h2>
          <p className="text-xs text-[#5C5346] mt-0.5">
            உங்கள் பகுதி வாய்மொழி வரலாற்றையும் பண்பாட்டுக் கதைகளையும் ஆவணப்படுத்துங்கள்.
          </p>
        </div>

        {/* Editor vs Preview Tab */}
        <div className="flex items-center gap-1 bg-[#EFE7D8] p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'editor' ? 'bg-[#FAF6EE] text-[#7B1113] shadow-xs' : 'text-[#5C5346]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>பதிவுப் படிவம்</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'preview' ? 'bg-[#FAF6EE] text-[#7B1113] shadow-xs' : 'text-[#5C5346]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>முன்னோட்டம்</span>
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="m-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {activeTab === 'editor' ? (
        <form onSubmit={e => e.preventDefault()} className="p-4 sm:p-6 space-y-6">
          {/* Content Type Selector */}
          <div>
            <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-2">
              உள்ளடக்க வகை
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setContentType('text')}
                className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  contentType === 'text'
                    ? 'border-[#7B1113] bg-[#7B1113]/10 text-[#7B1113] shadow-xs'
                    : 'border-[#E2D9CE] bg-[#FAF6EE] text-[#5C5346] hover:bg-[#EFE7D8]'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>எழுத்து வடிவம்</span>
              </button>

              <button
                type="button"
                onClick={() => setContentType('audio')}
                className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  contentType === 'audio'
                    ? 'border-[#7B1113] bg-[#7B1113]/10 text-[#7B1113] shadow-xs'
                    : 'border-[#E2D9CE] bg-[#FAF6EE] text-[#5C5346] hover:bg-[#EFE7D8]'
                }`}
              >
                <Volume2 className="w-5 h-5" />
                <span>ஒலி வடிவம்</span>
              </button>

              <button
                type="button"
                onClick={() => setContentType('document')}
                className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  contentType === 'document'
                    ? 'border-[#7B1113] bg-[#7B1113]/10 text-[#7B1113] shadow-xs'
                    : 'border-[#E2D9CE] bg-[#FAF6EE] text-[#5C5346] hover:bg-[#EFE7D8]'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span>ஆவண வடிவம்</span>
              </button>
            </div>
          </div>

          {/* Audio Story Section */}
          {contentType === 'audio' && (
            <div className="p-4 bg-[#F5EEDB]/60 rounded-xl border border-[#E8DEC8] space-y-4">
              <div>
                <h4 className="text-sm font-bold text-[#7B1113] flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  ஒலிப்பதிவு அல்லது கோப்புப் பதிவேற்றம்
                </h4>
                <p className="text-xs text-[#5C5346] mt-0.5">
                  நேரடியாக மைக்ரோஃபோனில் பேசிப் பதிவு செய்யலாம் அல்லது உங்கள் சாதனத்திலிருந்து ஆடியோ கோப்பைத் தேர்ந்தெடுக்கலாம்.
                </p>
              </div>

              {/* Two options: Live Record or File Upload */}
              <div className="flex flex-wrap items-center gap-2.5">
                {!isRecordingAudio ? (
                  <button
                    type="button"
                    onClick={handleStartLiveRecording}
                    disabled={isUploadingAudio || isTranscribing}
                    className="px-4 py-2.5 bg-linear-to-r from-[#7B1113] to-[#9E1A1D] hover:from-[#600E10] hover:to-[#851618] text-[#FDFBF7] rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
                  >
                    <Mic className="w-4 h-4 text-amber-200" />
                    <span>நேரடி ஒலிப்பதிவு தொடங்கு</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopLiveRecording}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md animate-pulse ring-4 ring-rose-200 transition-all"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>பதிவை நிறுத்து ({formatTimer(recordingSeconds)})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  disabled={isUploadingAudio || isRecordingAudio}
                  className="px-4 py-2.5 bg-[#FAF6EE] border border-[#E2D9CE] hover:bg-[#EFE7D8] text-[#1F2421] rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs disabled:opacity-50 transition-colors"
                >
                  {isUploadingAudio ? <Loader2 className="w-4 h-4 animate-spin text-[#7B1113]" /> : <Upload className="w-4 h-4 text-[#7B1113]" />}
                  <span>{isUploadingAudio ? 'பதிவேற்றம் நடைபெறுகிறது...' : 'ஒலிக் கோப்பைத் தேர்ந்தெடு'}</span>
                </button>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                  onChange={handleAudioFileChange}
                  className="hidden"
                />
              </div>

              {audioUrl && (
                <div className="space-y-3 pt-2">
                  <AudioPlayer src={audioUrl} title="பதிவேற்றப்பட்ட ஆடியோ" />

                  {/* Speech to text action button */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#FAF6EE] rounded-xl border border-[#C5A059]/40">
                    <div>
                      <p className="text-xs font-bold text-[#7B1113] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#C5A059]" />
                        தமிழ் பேச்சு-உரை மாற்றி (Gemini Speech-to-Text)
                      </p>
                      <p className="text-[11px] text-[#5C5346]">
                        பதிவேற்றிய ஆடியோவை நேரடியாகத் தூய தமிழ் உரையாக மாற்றலாம்.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleTranscribeSpeech}
                      disabled={isTranscribing}
                      className="px-4 py-2 bg-linear-to-r from-[#7B1113] to-[#881337] text-amber-50 hover:from-[#600E10] hover:to-[#70102E] rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
                    >
                      {isTranscribing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>உரைமாற்றம் நடைபெறுகிறது...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-[#C5A059]" />
                          <span>பேச்சை உரையாக மாற்று</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Document Upload Section */}
          {contentType === 'document' && (
            <div className="p-4 bg-[#F5EEDB]/60 rounded-xl border border-[#E8DEC8] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#7B1113] flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    உரை அல்லது PDF ஆவணம் பதிவேற்றம்
                  </h4>
                  <p className="text-xs text-[#5C5346] mt-0.5">
                    TXT அல்லது உரை கொண்ட PDF கோப்புகளைப் பதிவேற்றி உரையைப் பிரித்தெடுக்கலாம்.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  disabled={isExtractingDoc}
                  className="px-3.5 py-2 bg-[#7B1113] hover:bg-[#600E10] text-[#FDFBF7] rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-colors"
                >
                  {isExtractingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{isExtractingDoc ? 'பிரித்தெடுக்கிறது...' : 'ஆவணத்தைத் தேர்ந்தெடு'}</span>
                </button>
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".txt,.pdf"
                  onChange={handleDocFileChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1.5">
              கதையின் தலைப்பு *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="எ.கா. மதுரை சித்திரைத் திருவிழா கள்ளழகர் ஆற்றில் இறங்கும் வரலாறு"
              className="w-full bg-[#FAF6EE] border border-[#E2D9CE] rounded-xl px-4 py-2.5 text-sm text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
            />
          </div>

          {/* Category & District Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1.5">
                பொருள் / தலைப்பு வகை *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#FAF6EE] border border-[#E2D9CE] rounded-xl px-4 py-2.5 text-sm text-[#1F2421] focus:outline-none focus:border-[#7B1113]"
              >
                {TAMIL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1.5">
                மாவட்டம் *
              </label>
              <select
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="w-full bg-[#FAF6EE] border border-[#E2D9CE] rounded-xl px-4 py-2.5 text-sm text-[#1F2421] focus:outline-none focus:border-[#7B1113]"
              >
                {TAMIL_DISTRICTS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Village & Contributor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1.5">
                ஊர் / வட்டாரம்
              </label>
              <input
                type="text"
                value={village}
                onChange={e => setVillage(e.target.value)}
                placeholder="எ.கா. பொள்ளாச்சி, சுசீந்திரம், ஆனைமலை..."
                className="w-full bg-[#FAF6EE] border border-[#E2D9CE] rounded-xl px-4 py-2.5 text-sm text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1.5">
                கதை சொன்னவர் / பங்களிப்பாளர் பெயர்
              </label>
              <input
                type="text"
                value={contributorName}
                onChange={e => setContributorName(e.target.value)}
                placeholder="எ.கா. முத்துவேல் பாண்டியன் / சுப்புலட்சுமி பாட்டி"
                className="w-full bg-[#FAF6EE] border border-[#E2D9CE] rounded-xl px-4 py-2.5 text-sm text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
              />
            </div>
          </div>

          {/* Verification Type */}
          <div>
            <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1.5">
              பதிவு வகைப்பாடு (சரிபார்ப்பு நிலை)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(VERIFICATION_LABELS).map(([key, val]) => (
                <label
                  key={key}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                    verificationType === key
                      ? 'border-[#7B1113] bg-[#7B1113]/5'
                      : 'border-[#E2D9CE] hover:bg-[#EFE7D8]'
                  }`}
                >
                  <input
                    type="radio"
                    name="verificationType"
                    value={key}
                    checked={verificationType === key}
                    onChange={() => setVerificationType(key as VerificationType)}
                    className="mt-1 accent-[#7B1113]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#1F2421] block">{val.label}</span>
                    <span className="text-[11px] text-[#5C5346] block">{val.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Full Story Text in Tamil */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold text-[#7B1113] uppercase tracking-wider">
                கதையின் முழு உரை (தமிழ் எழுத்துகளில்) *
              </label>

              {/* Live Voice Typing Button */}
              <button
                type="button"
                onClick={handleToggleDictation}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                  isDictatingText
                    ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-300'
                    : 'bg-[#7B1113]/10 text-[#7B1113] hover:bg-[#7B1113]/20 border border-[#7B1113]/30'
                }`}
                title={isDictatingText ? 'குரல் தட்டச்சை நிறுத்து' : 'பேசி தட்டச்சு செய்க'}
              >
                {isDictatingText ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#C5A059]" />}
                <span>{isDictatingText ? 'பேசுங்கள்... உரை தட்டச்சாகிறது (நிறுத்த அழுத்தவும்)' : 'குரல்வழித் தட்டச்சு (பேசி எழுதலாம்)'}</span>
              </button>
            </div>
            <textarea
              rows={9}
              value={fullText}
              onChange={e => {
                setFullText(e.target.value);
                if (contentType === 'audio') {
                  setCorrectedTranscript(e.target.value);
                }
              }}
              placeholder="கதையின் முழுப் பதிவை இங்கு தட்டச்சு செய்யவும் அல்லது ஒட்டவும். வட்டார வழக்குச் சொற்களையும் பத்தி இடைவெளிகளையும் பாதுகாக்கவும்..."
              className="w-full bg-[#FAF6EE] border border-[#E2D9CE] rounded-xl p-4 text-sm sm:text-base leading-relaxed text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113] font-['Noto_Serif_Tamil',serif]"
            />
          </div>

          {/* Short Excerpt */}
          <div>
            <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1.5">
              சுருக்கம் (முகப்பு அட்டையில் காட்டப்படும் 1-2 வரிகள்)
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="கதையின் முக்கியக் குறிப்பு (வெற்று எனில் தானாக முதல் வரிகள் எடுக்கப்படும்)"
              className="w-full bg-[#FAF6EE] border border-[#E2D9CE] rounded-xl px-4 py-2.5 text-sm text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
            />
          </div>

          {/* Source Citation & Historical Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1.5">
                கதையின் மூலம் / மேற்கோள் (Source Citation)
              </label>
              <input
                type="text"
                value={sourceCitation}
                onChange={e => setSourceCitation(e.target.value)}
                placeholder="எ.கா. பெரியாரின் நேர்காணல், குடும்பக் குறிப்பு, ஊர் முதியவர் பேச்சு..."
                className="w-full bg-[#FAF6EE] border border-[#E2D9CE] rounded-xl px-4 py-2.5 text-sm text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1.5">
                கதையின் காலம் (Historical Period)
              </label>
              <input
                type="text"
                value={originalPeriod}
                onChange={e => setOriginalPeriod(e.target.value)}
                placeholder="எ.கா. 1960-கள், சோழர் காலம், 20-ஆம் நூற்றாண்டு..."
                className="w-full bg-[#FAF6EE] border border-[#E2D9CE] rounded-xl px-4 py-2.5 text-sm text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
              />
            </div>
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1.5">
              கவர் படம் (விருப்பத்தேர்வு)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage}
                className="px-3.5 py-2 border border-[#E2D9CE] hover:bg-[#EFE7D8] text-[#1F2421] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                <span>{isUploadingImage ? 'பதிவேற்றுகிறது...' : 'படம் பதிவேற்று'}</span>
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              {coverImageUrl && (
                <div className="flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle className="w-4 h-4" />
                  <span>படம் இணைக்கப்பட்டது</span>
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl('')}
                    className="text-rose-700 hover:underline ml-2"
                  >
                    நீக்கு
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Copyright & Permission Confirmation */}
          <div className="p-4 bg-[#FDFBF7] border border-[#C5A059]/50 rounded-xl space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={copyrightConfirmed}
                onChange={e => setCopyrightConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#7B1113] rounded"
              />
              <span className="text-xs sm:text-sm text-[#1F2421] leading-relaxed">
                இக்கதையை அல்லது ஒலிப்பதிவை நினைவோசை காப்பகத்தில் பொதுப்பயன்பாட்டிற்காகப் பகிர்வதற்கான முழு உரிமை / அனுமதி என்னிடம் உள்ளது என்பதை உறுதிப்படுத்துகிறேன். தவறான அல்லது பிறரின் பதிப்புரிமை மீறிய உள்ளடக்கங்கள் நிர்வாகத்தால் நீக்கப்படலாம் என்பதை ஏற்றுக்கொள்கிறேன். *
              </span>
            </label>
          </div>

          {/* Action Buttons: Draft vs Publish */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E8DEC8]">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 border border-[#E2D9CE] hover:bg-[#EFE7D8] text-[#5C5346] rounded-xl text-xs sm:text-sm font-semibold transition-colors"
            >
              ரத்து செய்
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={isSaving}
                className="px-4 py-2.5 bg-[#EFE7D8] hover:bg-[#E2D9CE] text-[#5C5346] rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>வரைவாகச் சேமி</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit('public')}
                disabled={isSaving}
                className="px-5 py-2.5 bg-[#7B1113] hover:bg-[#600E10] text-[#FDFBF7] rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{initialStory ? 'புதுப்பித்து வெளியிடு' : 'கதையை வெளியிடு'}</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Preview Tab */
        <div className="p-4 sm:p-8 space-y-6">
          <div className="border-b border-[#E8DEC8] pb-4">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#7B1113]/10 text-[#7B1113]">
              {category}
            </span>
            <h1 className="font-['Noto_Serif_Tamil',serif] font-bold text-2xl text-[#7B1113] mt-2">
              {title || 'தலைப்பு உள்ளிடப்படவில்லை'}
            </h1>
            <p className="text-xs text-[#5C5346] mt-1">
              பங்களிப்பாளர்: {contributorName || 'பெயரற்றவர்'} • {district} {village ? `• ${village}` : ''}
            </p>
          </div>

          {coverImageUrl && (
            <div className="rounded-xl overflow-hidden max-h-72 w-full">
              <img src={coverImageUrl} alt={title} className="w-full h-full object-cover" />
            </div>
          )}

          {contentType === 'audio' && audioUrl && (
            <AudioPlayer src={audioUrl} title={title} isOriginalRecording={true} />
          )}

          <div className="font-['Noto_Serif_Tamil',serif] text-base leading-relaxed text-[#26221D] whitespace-pre-wrap">
            {fullText || 'கதையின் உரை இன்னும் எழுதப்படவில்லை.'}
          </div>

          <div className="pt-4 border-t border-[#E8DEC8] flex justify-end">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className="px-4 py-2 bg-[#7B1113] text-[#FDFBF7] rounded-xl text-xs font-semibold"
            >
              மீண்டும் படிவத்திற்குச் செல்
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
