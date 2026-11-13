import React, { useState, useEffect } from 'react';
import { Story, DistrictStat } from '../types.ts';
import { api } from '../services/api.ts';
import { stt, SpeechRecognitionStatus } from '../services/stt.ts';
import { TAMIL_CATEGORIES, TAMIL_DISTRICTS } from '../constants/tamilData.ts';
import { StoryCard } from './StoryCard.tsx';
import { Search, MapPin, Filter, RotateCcw, BookOpen, Volume2, Sparkles, Layers, Mic, MicOff } from 'lucide-react';

interface SearchFilterProps {
  onOpenDetail: (story: Story) => void;
  onOpenReport: (story: Story) => void;
  onShowToast: (msg: string) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  onOpenDetail,
  onOpenReport,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isVoiceSearching, setIsVoiceSearching] = useState<boolean>(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('அனைத்தும்');
  const [selectedCategory, setSelectedCategory] = useState<string>('அனைத்தும்');
  const [selectedContentType, setSelectedContentType] = useState<string>('அனைத்தும்');
  const [villageFilter, setVillageFilter] = useState<string>('');

  const [stories, setStories] = useState<Story[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [districtStats, setDistrictStats] = useState<DistrictStat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load district statistics
  useEffect(() => {
    api.getDistrictStats().then(res => {
      setDistrictStats(res.stats || []);
    }).catch(() => {});
  }, []);

  const handleToggleVoiceSearch = () => {
    if (isVoiceSearching) {
      stt.stop();
      setIsVoiceSearching(false);
      onShowToast('குரல்வழித் தேடல் நிறுத்தப்பட்டது.');
    } else {
      setIsVoiceSearching(true);
      onShowToast('பேசுங்கள்... நீங்கள் கூறும் சொல் தேடப்படும்.');

      stt.start(
        '',
        (text: string) => {
          setSearchTerm(text.trim());
        },
        (status: SpeechRecognitionStatus) => {
          setIsVoiceSearching(status.isListening);
          if (status.error) {
            onShowToast(status.error);
            setIsVoiceSearching(false);
          }
        }
      );
    }
  };

  // Fetch filtered stories
  const fetchStories = async () => {
    setIsLoading(true);
    try {
      const res = await api.getStories({
        search: searchTerm,
        district: selectedDistrict !== 'அனைத்தும்' ? selectedDistrict : undefined,
        village: villageFilter || undefined,
        category: selectedCategory !== 'அனைத்தும்' ? selectedCategory : undefined,
        contentType: selectedContentType !== 'அனைத்தும்' ? selectedContentType : undefined,
        limit: 20,
      });
      setStories(res.stories);
      setTotalCount(res.total);
    } catch {
      onShowToast('கதைகளைத் தேடுவதில் பிழை ஏற்பட்டது.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStories();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedDistrict, selectedCategory, selectedContentType, villageFilter]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDistrict('அனைத்தும்');
    setSelectedCategory('அனைத்தும்');
    setSelectedContentType('அனைத்தும்');
    setVillageFilter('');
  };

  const getDistrictStoryCount = (d: string) => {
    const found = districtStats.find(s => s.district === d);
    return found ? found.count : 0;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-['Noto_Serif_Tamil',serif] font-bold text-2xl sm:text-3xl text-[#7B1113] flex items-center gap-2">
          <Search className="w-6 h-6 text-[#C5A059]" />
          கதைக் களஞ்சியம் & தேடல்
        </h1>
        <p className="text-xs sm:text-sm text-[#5C5346] mt-1">
          வட்டார வழக்குகள், மாவட்டங்கள், திருவிழாக்கள் மற்றும் தலைப்புகள் வாரியாகத் தமிழ் வாய்மொழி வரலாற்றை ஆராய்க.
        </p>
      </div>

      {/* Main Search Input */}
      <div className="bg-[#FAF6EE] border border-[#E8DEC8] p-4 rounded-2xl shadow-xs mb-6">
        <div className="relative mb-4">
          <Search className="w-5 h-5 text-[#786C5E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="சொற்கள், ஊர்ப் பெயர்கள், பாட்டிகளின் நினைவுகள், திருவிழாக்கள் தேடுக..."
            className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl pl-11 pr-12 py-3 text-sm text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113] shadow-inner"
          />
          {/* Voice Search Button */}
          <button
            type="button"
            onClick={handleToggleVoiceSearch}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
              isVoiceSearching
                ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-300'
                : 'text-[#7B1113] hover:bg-[#EFE7D8]'
            }`}
            title={isVoiceSearching ? 'குரல் தேடலை நிறுத்து' : 'குரல்வழித் தேடல் (பேசித் தேடலாம்)'}
          >
            {isVoiceSearching ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* District selector */}
          <div>
            <label className="block text-[11px] font-bold text-[#7B1113] uppercase tracking-wider mb-1">
              மாவட்டம்
            </label>
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl px-3 py-2 text-xs text-[#1F2421] focus:outline-none focus:border-[#7B1113]"
            >
              <option value="அனைத்தும்">அனைத்து மாவட்டங்களும்</option>
              {TAMIL_DISTRICTS.map(d => {
                const count = getDistrictStoryCount(d);
                return (
                  <option key={d} value={d}>
                    {d} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Village text filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#7B1113] uppercase tracking-wider mb-1">
              ஊர் / வட்டாரம்
            </label>
            <input
              type="text"
              value={villageFilter}
              onChange={e => setVillageFilter(e.target.value)}
              placeholder="எ.கா. பொள்ளாச்சி, சுசீந்திரம்..."
              className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl px-3 py-2 text-xs text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
            />
          </div>

          {/* Content Type selector */}
          <div>
            <label className="block text-[11px] font-bold text-[#7B1113] uppercase tracking-wider mb-1">
              உள்ளடக்க வடிவம்
            </label>
            <select
              value={selectedContentType}
              onChange={e => setSelectedContentType(e.target.value)}
              className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl px-3 py-2 text-xs text-[#1F2421] focus:outline-none focus:border-[#7B1113]"
            >
              <option value="அனைத்தும்">அனைத்து வடிவங்களும்</option>
              <option value="text">எழுத்து வடிவம்</option>
              <option value="audio">ஒலி வடிவம்</option>
              <option value="document">ஆவண வடிவம்</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-4 pt-3 border-t border-[#EFE7D8]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#7B1113] uppercase tracking-wider">
              பொருள் / தலைப்பு வகை
            </span>
            {(selectedDistrict !== 'அனைத்தும்' || selectedCategory !== 'அனைத்தும்' || selectedContentType !== 'அனைத்தும்' || searchTerm || villageFilter) && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-[#7B1113] hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>வடிகட்டிகளை மீட்டமை</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedCategory('அனைத்தும்')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === 'அனைத்தும்'
                  ? 'bg-[#7B1113] text-[#FDFBF7] font-semibold'
                  : 'bg-[#EFE7D8] text-[#5C5346] hover:bg-[#E2D9CE]'
              }`}
            >
              அனைத்தும்
            </button>
            {TAMIL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#7B1113] text-[#FDFBF7] font-semibold'
                    : 'bg-[#EFE7D8] text-[#5C5346] hover:bg-[#E2D9CE]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Regional Explorer Cards */}
      {districtStats.length > 0 && selectedDistrict === 'அனைத்தும்' && !searchTerm && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-['Noto_Serif_Tamil',serif] font-bold text-lg text-[#7B1113] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#C5A059]" />
              மாவட்ட வாரியான கதைகள் (Regional Archive)
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {districtStats.slice(0, 12).map(stat => (
              <button
                key={stat.district}
                onClick={() => setSelectedDistrict(stat.district)}
                className="p-2.5 rounded-xl bg-[#FAF6EE] border border-[#E8DEC8] hover:border-[#7B1113] hover:bg-[#F5EEDB] text-left transition-all group"
              >
                <span className="block text-xs font-bold text-[#1F2421] group-hover:text-[#7B1113] truncate">
                  {stat.district}
                </span>
                <span className="block text-[11px] text-[#786C5E] mt-0.5">
                  {stat.count} கதைகள்
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-[#5C5346]">
            கண்டறியப்பட்ட கதைகள்: <span className="text-[#7B1113]">{totalCount}</span>
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-[#7B1113] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-[#786C5E]">களஞ்சியத்திலிருந்து கதைகள் பெறப்படுகின்றன...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12 bg-[#FAF6EE] border border-dashed border-[#E2D9CE] rounded-2xl p-6">
            <BookOpen className="w-10 h-10 text-[#C5A059] mx-auto mb-2" />
            <h3 className="font-bold text-base text-[#1F2421] mb-1">தேடல் முடிவுகள் இல்லை</h3>
            <p className="text-xs text-[#786C5E] max-w-sm mx-auto mb-4">
              நீங்கள் உள்ளிட்ட தேடல் சொல்லுக்கான கதைகள் கிடைக்கவில்லை. சொற்களை மாற்றியோ அல்லது வடிகட்டிகளை மீட்டமைத்தோ மீண்டும் முயற்சி செய்யவும்.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-[#7B1113] text-[#FDFBF7] rounded-xl text-xs font-semibold"
            >
              அனைத்துக் கதைகளையும் காட்டு
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {stories.map(story => (
              <StoryCard
                key={story.id}
                story={story}
                onOpenDetail={onOpenDetail}
                onOpenReport={onOpenReport}
                onShowToast={onShowToast}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
