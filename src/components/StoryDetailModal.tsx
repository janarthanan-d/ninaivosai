import React, { useState, useEffect } from 'react';
import { Story, Comment } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { tts } from '../services/tts.ts';
import { AudioPlayer } from './AudioPlayer.tsx';
import { VERIFICATION_LABELS, CONTENT_TYPE_LABELS } from '../constants/tamilData.ts';
import {
  X,
  Heart,
  Bookmark,
  Share2,
  Headphones,
  MapPin,
  Calendar,
  AlertCircle,
  Play,
  Pause,
  Square,
  MessageSquare,
  Send,
  Sparkles,
  FileText,
  Volume2
} from 'lucide-react';

interface StoryDetailModalProps {
  story: Story;
  onClose: () => void;
  onOpenReport: (story: Story) => void;
  onShowToast: (msg: string) => void;
}

export const StoryDetailModal: React.FC<StoryDetailModalProps> = ({
  story,
  onClose,
  onOpenReport,
  onShowToast
}) => {
  const { user, openAuthModal } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(story.isLiked || false);
  const [likesCount, setLikesCount] = useState<number>(story.likesCount || 0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(story.isBookmarked || false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('large');

  // TTS State
  const [ttsPlaying, setTtsPlaying] = useState<boolean>(false);
  const [ttsPaused, setTtsPaused] = useState<boolean>(false);
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);

  useEffect(() => {
    // Fetch full story details and comments
    api.getStory(story.id).then(res => {
      setComments(res.comments || []);
      if (res.story.isLiked !== undefined) setIsLiked(res.story.isLiked);
      if (res.story.isBookmarked !== undefined) setIsBookmarked(res.story.isBookmarked);
    }).catch(() => {
      // ignore
    });

    const unsubscribe = tts.subscribe(state => {
      setTtsPlaying(state.isPlaying);
      setTtsPaused(state.isPaused);
      setTtsSpeed(state.rate);
    });

    return () => {
      unsubscribe();
      tts.stop();
    };
  }, [story.id]);

  const handleLike = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    const prev = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prev);
    setLikesCount(prev ? Math.max(0, prevCount - 1) : prevCount + 1);
    try {
      const res = await api.toggleLike(story.id);
      setIsLiked(res.liked);
      setLikesCount(res.count);
    } catch {
      setIsLiked(prev);
      setLikesCount(prevCount);
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    const prev = isBookmarked;
    setIsBookmarked(!prev);
    try {
      const res = await api.toggleBookmark(story.id);
      setIsBookmarked(res.bookmarked);
      onShowToast(res.bookmarked ? 'கதை சேமிக்கப்பட்டது!' : 'சேமிப்பிலிருந்து நீக்கப்பட்டது.');
    } catch {
      setIsBookmarked(prev);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/?storyId=${story.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      onShowToast('கதையின் இணைப்பு நகலெடுக்கப்பட்டது!');
    }
  };

  const handleStartTTS = () => {
    if (ttsPaused) {
      tts.resume();
    } else {
      tts.speak(story.fullText);
      onShowToast('தமிழ் குரலில் கதை வாசிக்கப்படுகிறது.');
    }
  };

  const handlePauseTTS = () => {
    tts.pause();
  };

  const handleStopTTS = () => {
    tts.stop();
  };

  const handleSpeedChange = () => {
    const rates = [1.0, 1.25, 1.5, 0.8];
    const nextIdx = (rates.indexOf(ttsSpeed) + 1) % rates.length;
    tts.setRate(rates[nextIdx]);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await api.addComment(story.id, newComment.trim());
      setComments(prev => [...prev, res.comment]);
      setNewComment('');
      onShowToast('உங்கள் கருத்து வெற்றிகரமாகப் பதிவு செய்யப்பட்டது!');
    } catch (err: any) {
      onShowToast(err.message || 'கருத்தைப் பதிவிடுவதில் பிழை.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const verification = VERIFICATION_LABELS[story.verificationType] || VERIFICATION_LABELS.personal_memory;
  const contentType = CONTENT_TYPE_LABELS[story.contentType] || CONTENT_TYPE_LABELS.text;

  const fontClasses = {
    normal: 'text-base sm:text-lg leading-relaxed',
    large: 'text-lg sm:text-xl leading-loose',
    huge: 'text-xl sm:text-2xl leading-loose'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1F2421]/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-[#FAF6EE] border border-[#E8DEC8] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header bar */}
        <div className="p-4 sm:p-5 border-b border-[#E8DEC8] flex items-center justify-between bg-[#F5EEDB]/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#7B1113]/10 text-[#7B1113]">
              {story.category}
            </span>
            <span className="text-xs text-[#5C5346] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#7B1113]" />
              {story.district} {story.village ? `• ${story.village}` : ''}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#E2D9CE] text-[#5C5346] transition-colors"
            title="மூடு"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Story Reader */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {/* Verification Banner */}
          <div className="mb-4 p-3 rounded-xl border flex items-start gap-3 bg-[#FDFBF7]">
            <Sparkles className="w-5 h-5 text-[#C5A059] shrink-0 mt-0.5" />
            <div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${verification.color}`}>
                {verification.label}
              </span>
              <p className="text-xs text-[#6B5E4F] mt-1">{verification.desc}</p>
            </div>
          </div>

          {/* Story Title */}
          <h1 className="font-['Noto_Serif_Tamil',serif] font-bold text-2xl sm:text-3xl text-[#7B1113] leading-snug mb-4">
            {story.title}
          </h1>

          {/* Contributor and Date info */}
          <div className="flex items-center justify-between border-b border-[#EFE7D8] pb-4 mb-6">
            <div className="flex items-center gap-3">
              {story.ownerAvatar ? (
                <img
                  src={story.ownerAvatar}
                  alt={story.contributorName}
                  className="w-11 h-11 rounded-full object-cover border border-[#C5A059]"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#7B1113] text-[#FDFBF7] flex items-center justify-center font-bold text-base shadow-xs">
                  {story.contributorName ? story.contributorName.charAt(0) : 'க'}
                </div>
              )}
              <div>
                <p className="font-bold text-sm sm:text-base text-[#1F2421]">
                  {story.contributorName}
                </p>
                <p className="text-xs text-[#786C5E]">
                  பங்களிப்பாளர் {story.originalPeriod ? `• காலம்: ${story.originalPeriod}` : ''}
                </p>
              </div>
            </div>

            {/* Font size adjustments */}
            <div className="flex items-center gap-1 bg-[#EFE7D8] p-1 rounded-lg text-xs font-semibold text-[#5C5346]">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-0.5 rounded ${fontSize === 'normal' ? 'bg-[#FAF6EE] text-[#7B1113] shadow-xs' : ''}`}
                title="சாதாரண எழுத்து அளவு"
              >
                அ
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-0.5 rounded ${fontSize === 'large' ? 'bg-[#FAF6EE] text-[#7B1113] shadow-xs' : ''}`}
                title="பெரிய எழுத்து அளவு"
              >
                அ+
              </button>
              <button
                onClick={() => setFontSize('huge')}
                className={`px-2 py-0.5 rounded ${fontSize === 'huge' ? 'bg-[#FAF6EE] text-[#7B1113] shadow-xs' : ''}`}
                title="மிகப் பெரிய எழுத்து அளவு"
              >
                அ++
              </button>
            </div>
          </div>

          {/* Cover image if available */}
          {story.coverImageUrl && (
            <div className="mb-6 rounded-xl overflow-hidden border border-[#E8DEC8] max-h-80 w-full bg-[#EFE7D8]">
              <img
                src={story.coverImageUrl}
                alt={story.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Original Audio Recording (if audio story) */}
          {story.contentType === 'audio' && story.audioUrl && (
            <div className="mb-6">
              <h3 className="text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" />
                அசல் ஆடியோ பதிவு
              </h3>
              <AudioPlayer src={story.audioUrl} title={story.title} isOriginalRecording={true} />
            </div>
          )}

          {/* Tamil Text-to-Speech Control Bar */}
          <div className="bg-[#FAF6EE] border border-[#C5A059]/40 rounded-xl p-3 sm:p-4 mb-6 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#7B1113]/10 text-[#7B1113] flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#7B1113]">கதையைக் கேள் (தமிழ்க் குரல்)</p>
                <p className="text-[11px] text-[#786C5E]">உரையைத் தானியங்கித் தமிழ் குரலில் கேட்கலாம்</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!ttsPlaying ? (
                <button
                  onClick={handleStartTTS}
                  className="px-3 py-1.5 rounded-lg bg-[#7B1113] hover:bg-[#600E10] text-[#FDFBF7] text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{ttsPaused ? 'தொடர்' : 'ஒலிபரப்பு'}</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseTTS}
                  className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>இடைநிறுத்து</span>
                </button>
              )}

              <button
                onClick={handleStopTTS}
                disabled={!ttsPlaying && !ttsPaused}
                className="p-1.5 rounded-lg bg-[#EFE7D8] text-[#5C5346] hover:bg-[#E2D9CE] disabled:opacity-40 transition-colors"
                title="நிறுத்து"
              >
                <Square className="w-4 h-4" />
              </button>

              <button
                onClick={handleSpeedChange}
                className="px-2 py-1 text-xs font-bold bg-[#EFE7D8] text-[#7B1113] rounded-md hover:bg-[#E2D9CE] transition-colors"
                title="வாசிப்பு வேகம்"
              >
                {ttsSpeed}x
              </button>
            </div>
          </div>

          {/* Full Tamil Story Text */}
          <div className={`text-[#26221D] font-['Noto_Serif_Tamil',serif] whitespace-pre-wrap ${fontClasses[fontSize]} mb-8 selection:bg-[#7B1113]/20`}>
            {story.fullText}
          </div>

          {/* Transcripts Comparison (if story has transcripts) */}
          {(story.correctedTranscript || story.originalTranscript) && (
            <div className="mb-8 p-4 bg-[#F5EEDB]/60 rounded-xl border border-[#E8DEC8]">
              <h4 className="text-xs font-bold text-[#7B1113] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                ஒலி உரைமாற்றப் பதிவுகள் (Transcripts)
              </h4>
              {story.correctedTranscript && (
                <div className="mb-3">
                  <span className="text-[11px] font-bold text-[#2D2A26] block mb-1">
                    பங்களிப்பாளரால் சரிபார்க்கப்பட்ட உரை:
                  </span>
                  <p className="text-xs sm:text-sm text-[#3D352E] bg-[#FAF6EE] p-3 rounded-lg border border-[#E8DEC8]">
                    {story.correctedTranscript}
                  </p>
                </div>
              )}
              {story.originalTranscript && story.originalTranscript !== story.correctedTranscript && (
                <div>
                  <span className="text-[11px] font-bold text-[#786C5E] block mb-1">
                    இயந்திரம் உருவாக்கிய தொடக்க உரை:
                  </span>
                  <p className="text-xs text-[#5C5346] bg-[#FAF6EE] p-3 rounded-lg border border-[#E8DEC8] italic">
                    {story.originalTranscript}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Source Citation & Copyright info */}
          <div className="p-4 rounded-xl bg-[#FAF6EE] border border-[#E8DEC8] mb-8 text-xs text-[#5C5346] space-y-1.5">
            {story.sourceCitation && (
              <div>
                <span className="font-bold text-[#7B1113]">கதையின் மூலம் / மேற்கோள்: </span>
                <span>{story.sourceCitation}</span>
              </div>
            )}
            <div>
              <span className="font-bold text-[#7B1113]">பண்பாட்டுப் பாதுகாப்பு: </span>
              <span>
                இக்கதை தமிழ் வாய்மொழி மரபைப் பேணவும் எதிர்காலத் தலைமுறையினரின் ஆய்வுக்காகவும் நினைவோசை களஞ்சியத்தில் பதிவு செய்யப்பட்டுள்ளது.
              </span>
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t border-[#E8DEC8] pt-6">
            <h3 className="font-['Noto_Serif_Tamil',serif] font-bold text-lg text-[#7B1113] flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5" />
              கருத்துகள் ({comments.length})
            </h3>

            {/* Post comment form */}
            <form onSubmit={handleAddComment} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="இக்கதை பற்றிய உங்கள் எண்ணங்களைப் பகிர்க..."
                  className="flex-1 bg-[#FAF6EE] border border-[#E2D9CE] rounded-xl px-4 py-2.5 text-sm text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="px-4 py-2.5 bg-[#7B1113] hover:bg-[#600E10] text-[#FDFBF7] rounded-xl text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors shrink-0 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">பதிவிடு</span>
                </button>
              </div>
            </form>

            {/* Comments list */}
            {comments.length === 0 ? (
              <p className="text-xs text-[#786C5E] text-center py-4 bg-[#FAF6EE] rounded-xl border border-dashed border-[#E2D9CE]">
                இதுவரை கருத்துகள் இல்லை. முதல் கருத்தை நீங்களே பதிவிடுங்கள்!
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="p-3 rounded-xl bg-[#FAF6EE] border border-[#E8DEC8]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-[#7B1113]">{c.userName}</span>
                      <span className="text-[10px] text-[#786C5E]">
                        {new Date(c.createdAt).toLocaleDateString('ta-IN')}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#2D2A26]">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer action bar */}
        <div className="p-3 sm:p-4 border-t border-[#E8DEC8] bg-[#F5EEDB]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isLiked
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-[#FAF6EE] text-[#5C5346] hover:bg-[#EFE7D8]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-600' : ''}`} />
              <span>{likesCount}</span>
            </button>

            <button
              onClick={handleBookmark}
              className={`p-2 rounded-lg text-xs font-semibold transition-colors ${
                isBookmarked
                  ? 'bg-[#C5A059]/20 text-[#7B1113]'
                  : 'bg-[#FAF6EE] text-[#5C5346] hover:bg-[#EFE7D8]'
              }`}
              title={isBookmarked ? 'சேமிக்கப்பட்டது' : 'சேமிக்க'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-lg bg-[#FAF6EE] text-[#5C5346] hover:bg-[#EFE7D8] transition-colors"
              title="பகிர்"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onOpenReport(story)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-amber-800 hover:bg-amber-100/60 transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>புகார் செய்</span>
          </button>
        </div>
      </div>
    </div>
  );
};
