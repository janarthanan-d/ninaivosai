import React, { useState, useEffect } from 'react';
import { Story } from '../types.ts';
import { api } from '../services/api.ts';
import { StoryCard } from './StoryCard.tsx';
import { Bookmark, BookOpen, Loader2 } from 'lucide-react';

interface SavedViewProps {
  onOpenDetail: (story: Story) => void;
  onOpenReport: (story: Story) => void;
  onExploreStories: () => void;
  onShowToast: (msg: string) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  onOpenDetail,
  onOpenReport,
  onExploreStories,
  onShowToast
}) => {
  const [savedStories, setSavedStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSavedStories = async () => {
    setIsLoading(true);
    try {
      const res = await api.getUserBookmarks();
      setSavedStories(res.stories || []);
    } catch {
      onShowToast('சேமித்த கதைகளைப் பெறுவதில் பிழை.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedStories();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-['Noto_Serif_Tamil',serif] font-bold text-2xl sm:text-3xl text-[#7B1113] flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-[#C5A059] fill-current" />
          சேமித்த கதைகள் (நூலகம்)
        </h1>
        <p className="text-xs sm:text-sm text-[#5C5346] mt-1">
          நீங்கள் பின்னர் வாசிப்பதற்காகவும் கேட்பதற்காகவும் சேமித்து வைத்துள்ள கதைகளின் பெட்டகம்.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#7B1113] mx-auto mb-2" />
          <p className="text-xs text-[#786C5E]">சேமிக்கப்பட்ட கதைகள் பெறப்படுகின்றன...</p>
        </div>
      ) : savedStories.length === 0 ? (
        <div className="text-center py-12 bg-[#FAF6EE] border border-dashed border-[#E2D9CE] rounded-2xl p-6">
          <Bookmark className="w-10 h-10 text-[#C5A059] mx-auto mb-2" />
          <h3 className="font-bold text-base text-[#1F2421] mb-1">சேமித்த கதைகள் எதுவும் இல்லை</h3>
          <p className="text-xs text-[#786C5E] max-w-sm mx-auto mb-4">
            முகப்பு அல்லது தேடல் பக்கத்தில் கதைகளின் கீழ் உள்ள சேமிப்பு பொத்தானை அழுத்தி, உங்களுக்குப் பிடித்த கதைகளை இங்கு சேமித்துக் கொள்ளலாம்.
          </p>
          <button
            onClick={onExploreStories}
            className="px-4 py-2 bg-[#7B1113] text-[#FDFBF7] rounded-xl text-xs font-semibold"
          >
            கதைகளைத் தேடுக
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {savedStories.map(story => (
            <StoryCard
              key={story.id}
              story={{ ...story, isBookmarked: true }}
              onOpenDetail={onOpenDetail}
              onOpenReport={onOpenReport}
              onShowToast={onShowToast}
            />
          ))}
        </div>
      )}
    </div>
  );
};
