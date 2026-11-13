import React, { useState, useEffect } from 'react';
import { Story } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { TAMIL_DISTRICTS } from '../constants/tamilData.ts';
import { StoryCard } from './StoryCard.tsx';
import {
  User as UserIcon,
  MapPin,
  Calendar,
  Edit2,
  BookOpen,
  FileText,
  Trash2,
  PlusCircle,
  Loader2,
  Check,
  X
} from 'lucide-react';

interface ProfileViewProps {
  onOpenDetail: (story: Story) => void;
  onOpenReport: (story: Story) => void;
  onEditStory: (story: Story) => void;
  onNewStory: () => void;
  onShowToast: (msg: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onOpenDetail,
  onOpenReport,
  onEditStory,
  onNewStory,
  onShowToast
}) => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'published' | 'drafts'>('published');
  const [publishedStories, setPublishedStories] = useState<Story[]>([]);
  const [draftStories, setDraftStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(user?.name || '');
  const [editDistrict, setEditDistrict] = useState<string>(user?.district || 'மதுரை');
  const [editVillage, setEditVillage] = useState<string>(user?.village || '');
  const [editBio, setEditBio] = useState<string>(user?.bio || '');
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  const fetchUserStories = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMyStories();
      setPublishedStories(res.published || []);
      setDraftStories(res.drafts || []);
    } catch {
      onShowToast('உங்கள் கதைகளைப் பெறுவதில் பிழை.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStories();
  }, []);

  const handleDeleteStory = async (storyId: string) => {
    try {
      await api.deleteStory(storyId);
      onShowToast('கதை வெற்றிகரமாக நீக்கப்பட்டது.');
      setPublishedStories(prev => prev.filter(s => s.id !== storyId));
      setDraftStories(prev => prev.filter(s => s.id !== storyId));
    } catch (err: any) {
      onShowToast(err.message || 'நீக்குவதில் பிழை.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: editName,
        district: editDistrict,
        village: editVillage,
        bio: editBio
      });
      setIsEditingProfile(false);
      onShowToast('சுயவிவரம் வெற்றிகரமாகப் புதுப்பிக்கப்பட்டது!');
    } catch (err: any) {
      onShowToast(err.message || 'சுயவிவரத்தைப் புதுப்பிப்பதில் பிழை.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Profile Card */}
      <div className="bg-[#FAF6EE] border border-[#E8DEC8] rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-[#C5A059] shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-tr from-[#7B1113] to-[#9E1A1D] text-[#FDFBF7] flex items-center justify-center font-bold text-3xl shadow-md">
              {user.name.charAt(0)}
            </div>
          )}

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="font-['Noto_Serif_Tamil',serif] font-bold text-xl sm:text-2xl text-[#7B1113]">
                  {user.name}
                </h1>
                <p className="text-xs text-[#786C5E] font-medium">@{user.username}</p>
              </div>

              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="px-3.5 py-1.5 border border-[#E2D9CE] hover:bg-[#EFE7D8] text-[#5C5346] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors self-center sm:self-auto"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>சுயவிவரத்தைத் திருத்து</span>
              </button>
            </div>

            {/* Region & Date */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#5C5346] mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#7B1113]" />
                {user.district} {user.village ? `• ${user.village}` : ''}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#7B1113]" />
                இணைந்த நாள்: {new Date(user.createdAt).toLocaleDateString('ta-IN')}
              </span>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-xs sm:text-sm text-[#3D352E] mt-3 leading-relaxed">
                {user.bio}
              </p>
            )}

            {/* Stats Counter */}
            <div className="flex items-center justify-center sm:justify-start gap-6 mt-4 pt-3 border-t border-[#EFE7D8] text-xs">
              <div>
                <span className="font-bold text-base text-[#7B1113] block">
                  {publishedStories.length}
                </span>
                <span className="text-[#786C5E]">வெளியிடப்பட்டவை</span>
              </div>
              <div>
                <span className="font-bold text-base text-[#7B1113] block">
                  {draftStories.length}
                </span>
                <span className="text-[#786C5E]">வரைவுகள்</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inline Edit Profile Modal/Form */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-[#E8DEC8] space-y-4">
            <h3 className="text-xs font-bold text-[#7B1113] uppercase tracking-wider">
              சுயவிவரத்தைத் திருத்துதல்
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1F2421] mb-1">பெயர்</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7B1113]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1F2421] mb-1">மாவட்டம்</label>
                <select
                  value={editDistrict}
                  onChange={e => setEditDistrict(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7B1113]"
                >
                  {TAMIL_DISTRICTS.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1F2421] mb-1">ஊர்</label>
                <input
                  type="text"
                  value={editVillage}
                  onChange={e => setEditVillage(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7B1113]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1F2421] mb-1">சுயவிவரக் குறிப்பு</label>
                <input
                  type="text"
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#7B1113]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-1.5 border border-[#E2D9CE] rounded-xl text-xs font-semibold text-[#5C5346]"
              >
                ரத்து
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-4 py-1.5 bg-[#7B1113] hover:bg-[#600E10] text-[#FDFBF7] rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isSavingProfile ? 'சேமிக்கப்படுகிறது...' : 'சேமி'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Stories Tabs: Published vs Drafts */}
      <div className="flex items-center justify-between border-b border-[#E8DEC8] mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('published')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'published'
                ? 'border-[#7B1113] text-[#7B1113]'
                : 'border-transparent text-[#786C5E] hover:text-[#1F2421]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>வெளியிடப்பட்ட கதைகள் ({publishedStories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('drafts')}
            className={`pb-3 text-sm font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'drafts'
                ? 'border-[#7B1113] text-[#7B1113]'
                : 'border-transparent text-[#786C5E] hover:text-[#1F2421]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>வரைவுகள் ({draftStories.length})</span>
          </button>
        </div>

        <button
          onClick={onNewStory}
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-[#7B1113] hover:bg-[#600E10] text-[#FDFBF7] rounded-xl text-xs font-semibold transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>புதிய கதை</span>
        </button>
      </div>

      {/* Stories Content */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#7B1113] mx-auto mb-2" />
          <p className="text-xs text-[#786C5E]">கதைகள் பெறப்படுகின்றன...</p>
        </div>
      ) : activeTab === 'published' ? (
        publishedStories.length === 0 ? (
          <div className="text-center py-12 bg-[#FAF6EE] border border-dashed border-[#E2D9CE] rounded-2xl p-6">
            <BookOpen className="w-10 h-10 text-[#C5A059] mx-auto mb-2" />
            <h3 className="font-bold text-base text-[#1F2421] mb-1">வெளியிடப்பட்ட கதைகள் இல்லை</h3>
            <p className="text-xs text-[#786C5E] max-w-sm mx-auto mb-4">
              நீங்கள் இன்னும் எந்தக் கதையையும் வெளியிடவில்லை. உங்கள் ஊரின் பாரம்பரியக் கதையையோ வாய்மொழி வரலாற்றையோ இப்போதே பகிருங்கள்!
            </p>
            <button
              onClick={onNewStory}
              className="px-4 py-2 bg-[#7B1113] text-[#FDFBF7] rounded-xl text-xs font-semibold"
            >
              முதல் கதையைப் பகிர்க
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {publishedStories.map(story => (
              <StoryCard
                key={story.id}
                story={story}
                onOpenDetail={onOpenDetail}
                onOpenReport={onOpenReport}
                onEditStory={onEditStory}
                onDeleteStory={handleDeleteStory}
                onShowToast={onShowToast}
              />
            ))}
          </div>
        )
      ) : draftStories.length === 0 ? (
        <div className="text-center py-12 bg-[#FAF6EE] border border-dashed border-[#E2D9CE] rounded-2xl p-6">
          <FileText className="w-10 h-10 text-[#C5A059] mx-auto mb-2" />
          <h3 className="font-bold text-base text-[#1F2421] mb-1">தனிப்பட்ட வரைவுகள் இல்லை</h3>
          <p className="text-xs text-[#786C5E] max-w-sm mx-auto">
            சேமிக்கப்பட்ட வரைவுக் கதைகள் எதுவும் இல்லை. கதைகளை எழுதி வரைவாகச் சேமித்து வைத்துப் பின்னர் வெளியிடலாம்.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {draftStories.map(story => (
            <StoryCard
              key={story.id}
              story={story}
              onOpenDetail={onOpenDetail}
              onOpenReport={onOpenReport}
              onEditStory={onEditStory}
              onDeleteStory={handleDeleteStory}
              onShowToast={onShowToast}
            />
          ))}
        </div>
      )}
    </div>
  );
};
