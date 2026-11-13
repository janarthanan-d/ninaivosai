import React, { useState } from 'react';
import { Story } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { tts } from '../services/tts.ts';
import { AudioPlayer } from './AudioPlayer.tsx';
import { VERIFICATION_LABELS, CONTENT_TYPE_LABELS } from '../constants/tamilData.ts';
import {
  Heart,
  Bookmark,
  Share2,
  Headphones,
  BookOpen,
  MapPin,
  Calendar,
  AlertCircle,
  Volume2,
  Check,
  MoreVertical,
  Trash2,
  Edit3,
  Sparkles
} from 'lucide-react';

interface StoryCardProps {
  story: Story;
  onOpenDetail: (story: Story) => void;
  onOpenReport: (story: Story) => void;
  onEditStory?: (story: Story) => void;
  onDeleteStory?: (storyId: string) => void;
  onShowToast: (msg: string) => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onOpenDetail,
  onOpenReport,
  onEditStory,
  onDeleteStory,
  onShowToast
}) => {
  const { user, openAuthModal } = useAuth();
  const [isLiked, setIsLiked] = useState<boolean>(story.isLiked || false);
  const [likesCount, setLikesCount] = useState<number>(story.likesCount || 0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(story.isBookmarked || false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSpeakingThis, setIsSpeakingThis] = useState<boolean>(false);

  const isOwner = user?.id === story.ownerId || user?.role === 'admin';
  const verification = VERIFICATION_LABELS[story.verificationType] || VERIFICATION_LABELS.personal_memory;
  const contentType = CONTENT_TYPE_LABELS[story.contentType] || CONTENT_TYPE_LABELS.text;

  const handleLike = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    const prevLiked = isLiked;
    const prevCount = likesCount;
    setIsLiked(!prevLiked);
    setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await api.toggleLike(story.id);
      setIsLiked(res.liked);
      setLikesCount(res.count);
    } catch {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      onShowToast('விருப்பத்தைப் பதிவு செய்வதில் பிழை.');
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
      onShowToast('சேமிப்பதில் பிழை ஏற்பட்டது.');
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/?storyId=${story.id}`;
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      onShowToast('கதையின் இணைப்பு நகலெடுக்கப்பட்டது!');
    } else {
      onShowToast(`இணைப்பு: ${url}`);
    }
  };

  const handleListenTTS = async () => {
    if (isSpeakingThis) {
      tts.stop();
      setIsSpeakingThis(false);
      return;
    }

    setIsSpeakingThis(true);
    onShowToast('கதை ஒலியாக வாசிக்கப்படுகிறது...');
    await tts.speak(story.fullText);
    setIsSpeakingThis(false);
  };

  const formatTamilDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const months = [
        'தை / ஜனவரி',
        'மாசி / பிப்ரவரி',
        'பங்குனி / மார்ச்',
        'சித்திரை / ஏப்ரல்',
        'வைகாசி / மே',
        'ஆனி / ஜூன்',
        'ஆடி / ஜூலை',
        'ஆவணி / ஆகஸ்ட்',
        'புரட்டாசி / செப்டம்பர்',
        'ஐப்பசி / அக்டோபர்',
        'கார்த்திகை / நவம்பர்',
        'மார்கழி / டிசம்பர்'
      ];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <article className="bg-[#FAF6EE] border border-[#E8DEC8] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow duration-300 mb-6">
      {/* 1. Contributor Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#EFE7D8]/80">
        <div className="flex items-center gap-3">
          {story.ownerAvatar ? (
            <img
              src={story.ownerAvatar}
              alt={story.contributorName}
              className="w-10 h-10 rounded-full object-cover border border-[#C5A059]"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#7B1113] to-[#580F15] text-[#FDFBF7] flex items-center justify-center font-bold text-sm shadow-xs">
              {story.contributorName ? story.contributorName.charAt(0) : 'க'}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-[#1F2421]">
                {story.contributorName}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EFE7D8] text-[#5C5346] font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#7B1113]" />
                {story.district} {story.village ? `• ${story.village}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#786C5E] mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>{formatTamilDate(story.createdAt)}</span>
              <span>•</span>
              <span className="text-[#7B1113] font-semibold">{story.category}</span>
            </div>
          </div>
        </div>

        {/* Action Menu (Share / Report / Edit / Delete) */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 text-[#786C5E] hover:text-[#1F2421] rounded-lg hover:bg-[#EFE7D8] transition-colors"
            title="கூடுதல் தேர்வுகள்"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl shadow-lg z-20 py-1 text-xs">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleShare();
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#FAF6EE] text-[#2D2A26]"
              >
                <Share2 className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>பகிர் (இணைப்பை நகலெடு)</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenReport(story);
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#FAF6EE] text-amber-800"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>புகார் செய்</span>
              </button>

              {isOwner && onEditStory && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onEditStory(story);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[#FAF6EE] text-blue-800 border-t border-[#EFE7D8]"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>கதையைத் திருத்து</span>
                </button>
              )}

              {isOwner && onDeleteStory && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (window.confirm('இக்கதையை நிச்சயமாக நீக்க விரும்புகிறீர்களா?')) {
                      onDeleteStory(story.id);
                    }
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-rose-50 text-rose-800"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>கதையை நீக்கு</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Cover Image (if available) */}
      {story.coverImageUrl && (
        <div
          className="relative w-full aspect-16/9 bg-[#EFE7D8] cursor-pointer overflow-hidden group"
          onClick={() => onOpenDetail(story)}
        >
          <img
            src={story.coverImageUrl}
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 text-[11px] font-semibold bg-[#1F2421]/80 text-[#FDFBF7] backdrop-blur-xs rounded-full">
              {contentType.label}
            </span>
          </div>
        </div>
      )}

      {/* 3. Story Content */}
      <div className="p-4 sm:p-5">
        {/* Verification Status Badge */}
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${verification.color}`}
            title={verification.desc}
          >
            {verification.label}
          </span>
          {story.originalPeriod && (
            <span className="text-[11px] text-[#786C5E] bg-[#EFE7D8]/80 px-2 py-0.5 rounded-full">
              காலம்: {story.originalPeriod}
            </span>
          )}
        </div>

        {/* Story Title */}
        <h2
          onClick={() => onOpenDetail(story)}
          className="font-['Noto_Serif_Tamil',serif] font-bold text-lg sm:text-xl text-[#7B1113] hover:underline cursor-pointer leading-snug mb-2"
        >
          {story.title}
        </h2>

        {/* Short Excerpt */}
        <p className="text-sm text-[#3D352E] leading-relaxed line-clamp-3 mb-3">
          {story.description || story.fullText}
        </p>

        {/* Audio Player if original audio exists */}
        {story.contentType === 'audio' && story.audioUrl && (
          <AudioPlayer src={story.audioUrl} title={story.title} isOriginalRecording={true} />
        )}

        {/* Source citation */}
        {story.sourceCitation && (
          <div className="text-[11px] text-[#6B5E4F] italic bg-[#EFE7D8]/50 p-2 rounded-lg border-l-2 border-[#C5A059] mb-3">
            <span className="font-semibold text-[#7B1113]">கதையின் மூலம்:</span> {story.sourceCitation}
          </div>
        )}

        {/* 4. Action Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-[#EFE7D8] text-xs">
          {/* Left actions: Like, TTS reader, Read full */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
                isLiked
                  ? 'bg-rose-100 text-rose-800 font-bold'
                  : 'text-[#5C5346] hover:bg-[#EFE7D8]'
              }`}
              title="விருப்பம்"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-600' : ''}`} />
              <span>{likesCount}</span>
            </button>

            {/* Tamil Text-to-Speech Button */}
            <button
              onClick={handleListenTTS}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all ${
                isSpeakingThis
                  ? 'bg-[#7B1113] text-[#FDFBF7] font-semibold animate-pulse'
                  : 'bg-[#C5A059]/15 text-[#7B1113] hover:bg-[#C5A059]/25 font-medium'
              }`}
              title="உரையை ஒலியாக வாசி"
            >
              {isSpeakingThis ? <Volume2 className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
              <span>{isSpeakingThis ? 'வாசிக்கிறது...' : 'கதையைக் கேள்'}</span>
            </button>

            {/* Read full story */}
            <button
              onClick={() => onOpenDetail(story)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#7B1113] hover:bg-[#7B1113]/10 font-semibold transition-colors"
              title="முழு கதையையும் வாசி"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">கதையை வாசி</span>
            </button>
          </div>

          {/* Right actions: Bookmark & Share */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleBookmark}
              className={`p-1.5 rounded-lg transition-colors ${
                isBookmarked
                  ? 'text-[#C5A059] bg-[#C5A059]/15'
                  : 'text-[#786C5E] hover:text-[#1F2421] hover:bg-[#EFE7D8]'
              }`}
              title={isBookmarked ? 'சேமிக்கப்பட்டது' : 'கதையைச் சேமி'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 text-[#786C5E] hover:text-[#1F2421] hover:bg-[#EFE7D8] rounded-lg transition-colors"
              title="பகிர்"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
