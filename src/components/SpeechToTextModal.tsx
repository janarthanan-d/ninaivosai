import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api.ts';
import { stt, SpeechRecognitionStatus } from '../services/stt.ts';
import { tts } from '../services/tts.ts';
import { AudioPlayer } from './AudioPlayer.tsx';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Upload,
  Copy,
  Check,
  Sparkles,
  X,
  FileText,
  Volume2,
  RefreshCw,
  Send,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface SpeechToTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseTextInStory: (text: string, audioUrl?: string) => void;
  onShowToast: (msg: string) => void;
}

export const SpeechToTextModal: React.FC<SpeechToTextModalProps> = ({
  isOpen,
  onClose,
  onUseTextInStory,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'record' | 'upload'>('live');

  // Transcribed or typed text
  const [resultText, setResultText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Live STT state
  const [isLiveListening, setIsLiveListening] = useState<boolean>(false);
  const [liveError, setLiveError] = useState<string | null>(null);

  // Audio Recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      stt.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  if (!isOpen) return null;

  // 1. Live Web Speech Recognition Handlers
  const handleToggleLiveSTT = () => {
    if (isLiveListening) {
      stt.stop();
      setIsLiveListening(false);
      onShowToast('குரல் தட்டச்சு நிறுத்தப்பட்டது.');
    } else {
      setLiveError(null);
      setErrorMessage(null);
      setIsLiveListening(true);
      onShowToast('பேசுங்கள்... உரை தட்டச்சாகிறது.');

      stt.start(
        resultText,
        (text: string) => {
          setResultText(text);
        },
        (status: SpeechRecognitionStatus) => {
          setIsLiveListening(status.isListening);
          if (status.error) {
            setLiveError(status.error);
            setIsLiveListening(false);
          }
        }
      );
    }
  };

  // 2. Direct Microphone Recording Handlers
  const handleStartRecording = async () => {
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

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);
      setRecordedAudioBlob(null);
      setRecordedAudioUrl(null);
      setErrorMessage(null);

      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);

      onShowToast('ஒலிப்பதிவு தொடங்கப்பட்டது...');
    } catch {
      setErrorMessage('மைக்ரோஃபோன் அணுகல் கிடைக்கவில்லை. உலாவி அமைப்புகளில் அனுமதி வழங்கப்பட்டுள்ளதா என்பதை உறுதிசெய்யவும்.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      onShowToast('ஒலிப்பதிவு முடிந்தது.');
    }
  };

  // 3. Transcribe Recorded Audio with Gemini
  const handleTranscribeRecordedAudio = async () => {
    if (!recordedAudioBlob) return;

    setIsProcessing(true);
    setErrorMessage(null);
    onShowToast('ஒலிப்பதிவு தமிழாக உரைமாற்றம் செய்யப்படுகிறது...');

    try {
      // First upload the recorded audio file to get persistent url
      const audioFile = new File([recordedAudioBlob], `recorded-${Date.now()}.webm`, {
        type: recordedAudioBlob.type || 'audio/webm',
      });
      const uploadRes = await api.uploadAudio(audioFile);
      setUploadedAudioUrl(uploadRes.audioUrl);

      // Transcribe via Gemini
      const transcribeRes = await api.transcribeAudio({ audioUrl: uploadRes.audioUrl });
      const current = resultText ? `${resultText.trim()}\n\n` : '';
      setResultText(`${current}${transcribeRes.transcript}`);
      onShowToast('பேச்சு வெற்றிகரமாகத் தமிழ் உரையாக மாற்றப்பட்டது!');
    } catch (err: any) {
      setErrorMessage(err.message || 'ஒலி உரைமாற்றம் செய்வதில் பிழை ஏற்பட்டது.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. File Upload Transcription Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    onShowToast('கோப்பு பதிவேற்றப்பட்டு உரைமாற்றம் செய்யப்படுகிறது...');

    try {
      const uploadRes = await api.uploadAudio(file);
      setUploadedAudioUrl(uploadRes.audioUrl);

      const transcribeRes = await api.transcribeAudio({ audioUrl: uploadRes.audioUrl });
      const current = resultText ? `${resultText.trim()}\n\n` : '';
      setResultText(`${current}${transcribeRes.transcript}`);
      onShowToast('ஒலி வெற்றிகரமாகத் தமிழ் உரையாக மாற்றப்பட்டது!');
    } catch (err: any) {
      setErrorMessage(err.message || 'ஒலி உரைமாற்றத்தில் பிழை ஏற்பட்டது.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyText = async () => {
    if (!resultText) return;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(resultText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      onShowToast('உரை நகலெடுக்கப்பட்டது!');
    }
  };

  const handleReadTextAloud = () => {
    if (!resultText) return;
    tts.speak(resultText);
    onShowToast('உரை ஒலியாக வாசிக்கப்படுகிறது...');
  };

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1F2421]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-[#FAF6EE] border border-[#E8DEC8] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8DEC8] bg-[#F5EEDB]/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7B1113] text-[#FDFBF7] flex items-center justify-center shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Noto_Serif_Tamil',serif] font-bold text-base sm:text-lg text-[#7B1113]">
                பேச்சை உரையாக மாற்று (Tamil Speech-to-Text)
              </h3>
              <p className="text-[11px] text-[#5C5346]">
                குரல்வழித் தட்டச்சு அல்லது ஆடியோ பதிவை நேரடியாகத் தமிழ் எழுத்துகளாக மாற்றுக.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stt.stop();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-[#E2D9CE] text-[#5C5346] transition-colors"
            title="மூடு"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-[#E8DEC8] bg-[#FAF6EE] px-4 pt-2">
          <button
            onClick={() => {
              stt.stop();
              setIsLiveListening(false);
              setActiveTab('live');
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'border-[#7B1113] text-[#7B1113]'
                : 'border-transparent text-[#786C5E] hover:text-[#1F2421]'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>நேரலைக் குரல் தட்டச்சு</span>
          </button>

          <button
            onClick={() => {
              stt.stop();
              setIsLiveListening(false);
              setActiveTab('record');
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'record'
                ? 'border-[#7B1113] text-[#7B1113]'
                : 'border-transparent text-[#786C5E] hover:text-[#1F2421]'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>நேரடி ஒலிப்பதிவு</span>
          </button>

          <button
            onClick={() => {
              stt.stop();
              setIsLiveListening(false);
              setActiveTab('upload');
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-[#7B1113] text-[#7B1113]'
                : 'border-transparent text-[#786C5E] hover:text-[#1F2421]'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>ஒலிக் கோப்புப் பதிவேற்றம்</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Error alerts */}
          {(errorMessage || liveError) && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage || liveError}</span>
            </div>
          )}

          {/* TAB 1: Live Web Speech Recognition */}
          {activeTab === 'live' && (
            <div className="p-4 bg-[#F5EEDB]/60 rounded-xl border border-[#E8DEC8] text-center space-y-3">
              <p className="text-xs text-[#5C5346]">
                கீழுள்ள மைக்ரோஃபோன் பொத்தானை அழுத்திப் பேசத் தொடங்குங்கள். உங்கள் தமிழ் உரை நிகழ்நேரத்தில் கீழே தோன்றும்.
              </p>

              <div className="flex flex-col items-center justify-center py-2">
                <button
                  type="button"
                  onClick={handleToggleLiveSTT}
                  className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md transition-all ${
                    isLiveListening
                      ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-300'
                      : 'bg-[#7B1113] hover:bg-[#600E10] text-[#FDFBF7]'
                  }`}
                  title={isLiveListening ? 'நிறுத்து' : 'பேசத் தொடங்கு'}
                >
                  {isLiveListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                </button>
                <span className="text-xs font-bold text-[#7B1113] mt-2">
                  {isLiveListening ? 'பேசுங்கள்... உரை தட்டச்சாகிறது' : 'பேசத் தொடங்க அழுத்தவும்'}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: Audio Recording & Gemini Transcription */}
          {activeTab === 'record' && (
            <div className="p-4 bg-[#F5EEDB]/60 rounded-xl border border-[#E8DEC8] text-center space-y-3">
              <p className="text-xs text-[#5C5346]">
                முதியவர்களின் பேச்சையோ உங்கள் வாய்மொழி நினைவுகளையோ நேரடியாகப் பதிவு செய்து AI மூலம் உரையாக மாற்றலாம்.
              </p>

              <div className="flex flex-col items-center justify-center py-2">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    disabled={isProcessing}
                    className="w-16 h-16 rounded-full bg-linear-to-tr from-[#7B1113] to-[#9E1A1D] hover:scale-105 text-[#FDFBF7] flex items-center justify-center shadow-md transition-all disabled:opacity-50"
                  >
                    <Mic className="w-7 h-7" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md animate-pulse ring-4 ring-rose-300"
                  >
                    <Square className="w-6 h-6 fill-current" />
                  </button>
                )}

                <div className="mt-2">
                  <span className="font-mono text-sm font-bold text-[#7B1113]">
                    {isRecording ? `பதிவாகிறது: ${formatTimer(recordingSeconds)}` : 'பதிவைத் தொடங்க அழுத்தவும்'}
                  </span>
                </div>
              </div>

              {recordedAudioUrl && !isRecording && (
                <div className="pt-3 border-t border-[#E8DEC8] space-y-3">
                  <AudioPlayer src={recordedAudioUrl} title="பதிவு செய்யப்பட்ட உரை" isOriginalRecording={true} />

                  <button
                    type="button"
                    onClick={handleTranscribeRecordedAudio}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-linear-to-r from-[#7B1113] to-[#881337] hover:from-[#600E10] hover:to-[#70102E] text-amber-50 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>உரைமாற்றம் நடைபெறுகிறது...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#C5A059]" />
                        <span>பேச்சை உரையாக மாற்று (Gemini 3.5 Transcribe)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: File Upload Transcription */}
          {activeTab === 'upload' && (
            <div className="p-4 bg-[#F5EEDB]/60 rounded-xl border border-[#E8DEC8] text-center space-y-3">
              <p className="text-xs text-[#5C5346]">
                உங்கள் கணினி அல்லது தொலைபேசியில் உள்ள MP3, WAV, M4A அல்லது WEBM ஒலிக் கோப்பைப் பதிவேற்றித் தமிழாக மாற்றலாம்.
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="px-5 py-3 bg-[#7B1113] hover:bg-[#600E10] text-[#FDFBF7] rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 mx-auto shadow-xs transition-colors disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{isProcessing ? 'உரைமாற்றம் நடைபெறுகிறது...' : 'ஒலிக் கோப்பைத் தேர்ந்தெடுத்து மாற்று'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                onChange={handleFileUpload}
                className="hidden"
              />

              {uploadedAudioUrl && (
                <div className="pt-2">
                  <AudioPlayer src={uploadedAudioUrl} title="பதிவேற்றப்பட்ட ஆடியோ" isOriginalRecording={true} />
                </div>
              )}
            </div>
          )}

          {/* Resulting Tamil Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#7B1113] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                மாற்றப்பட்ட தமிழ் உரை (Transcribed Tamil Text)
              </label>

              {resultText && (
                <button
                  type="button"
                  onClick={() => setResultText('')}
                  className="text-[11px] text-rose-700 hover:underline"
                >
                  உரையை அழி
                </button>
              )}
            </div>

            <textarea
              rows={7}
              value={resultText}
              onChange={e => setResultText(e.target.value)}
              placeholder="பேசிய உரை இங்கு தமிழ் எழுத்துகளில் தோன்றும். நீங்கள் சொற்களையோ வட்டார வழக்கையோ சரிசெய்து கொள்ளலாம்..."
              className="w-full bg-[#FAF6EE] border border-[#E2D9CE] rounded-xl p-3.5 text-sm sm:text-base leading-relaxed text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113] font-['Noto_Serif_Tamil',serif]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-[#E8DEC8] bg-[#F5EEDB]/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              disabled={!resultText}
              className="px-3 py-1.5 bg-[#FAF6EE] border border-[#E2D9CE] hover:bg-[#EFE7D8] text-[#5C5346] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
              title="உரையை நகலெடு"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'நகலெடுக்கப்பட்டது' : 'நகலெடு'}</span>
            </button>

            <button
              type="button"
              onClick={handleReadTextAloud}
              disabled={!resultText}
              className="px-3 py-1.5 bg-[#FAF6EE] border border-[#E2D9CE] hover:bg-[#EFE7D8] text-[#5C5346] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
              title="உரையை ஒலியாகக் கேள்"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="hidden sm:inline">குரலில் கேள்</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (resultText) {
                onUseTextInStory(resultText, uploadedAudioUrl || recordedAudioUrl || undefined);
                onClose();
              }
            }}
            disabled={!resultText}
            className="px-4 py-2 bg-[#7B1113] hover:bg-[#600E10] text-[#FDFBF7] rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>இவ்வுரையைக் கதையாகச் சேர்</span>
          </button>
        </div>
      </div>
    </div>
  );
};
