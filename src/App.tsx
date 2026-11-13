import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Story } from './types.ts';
import { api } from './services/api.ts';
import { TAMIL_CATEGORIES } from './constants/tamilData.ts';
import { Navbar } from './components/Navbar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { StoryCard } from './components/StoryCard.tsx';
import { StoryDetailModal } from './components/StoryDetailModal.tsx';
import { StoryForm } from './components/StoryForm.tsx';
import { SearchFilter } from './components/SearchFilter.tsx';
import { SavedView } from './components/SavedView.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { SpeechToTextModal } from './components/SpeechToTextModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ReportModal } from './components/ReportModal.tsx';
import { AdminModal } from './components/AdminModal.tsx';
import { Toast } from './components/Toast.tsx';
import {
  Sparkles,
  BookOpen,
  PlusCircle,
  Search,
  Filter,
  Loader2,
  Heart,
  Feather,
  ShieldCheck,
  Headphones,
  Compass,
  Mic
} from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, openAuthModal } = useAuth();

  // Navigation: 'home' | 'search' | 'create' | 'saved' | 'profile'
  const [currentTab, setCurrentTab] = useState<string>('home');

  // Stories Feed
  const [feedStories, setFeedStories] = useState<Story[]>([]);
  const [feedCategory, setFeedCategory] = useState<string>('அனைத்தும்');
  const [feedPage, setFeedPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Modals & Overlays
  const [activeStoryDetail, setActiveStoryDetail] = useState<Story | null>(null);
  const [reportingStory, setReportingStory] = useState<Story | null>(null);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isSTTModalOpen, setIsSTTModalOpen] = useState<boolean>(false);
  const [initialSTTText, setInitialSTTText] = useState<string>('');
  const [initialSTTAudioUrl, setInitialSTTAudioUrl] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deep linking: check URL for storyId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get('storyId');
    if (storyId) {
      api.getStory(storyId).then(res => {
        if (res.story) {
          setActiveStoryDetail(res.story);
        }
      }).catch(() => {});
    }
  }, []);

  // Fetch Feed Stories
  const fetchFeed = async (page: number = 1, append: boolean = false) => {
    if (page === 1) setIsLoadingFeed(true);
    else setIsLoadingMore(true);

    try {
      const res = await api.getStories({
        category: feedCategory !== 'அனைத்தும்' ? feedCategory : undefined,
        page,
        limit: 8
      });

      if (append) {
        setFeedStories(prev => [...prev, ...res.stories]);
      } else {
        setFeedStories(res.stories);
      }
      setFeedPage(res.page);
      setTotalPages(res.totalPages);
    } catch {
      setToastMessage('கதைகளைப் பெறுவதில் பிழை ஏற்பட்டது.');
    } finally {
      setIsLoadingFeed(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFeed(1, false);
  }, [feedCategory]);

  const handleLoadMore = () => {
    if (feedPage < totalPages && !isLoadingMore) {
      fetchFeed(feedPage + 1, true);
    }
  };

  const handleEditStory = (story: Story) => {
    setEditingStory(story);
    setCurrentTab('create');
  };

  const handleDeleteFeedStory = async (storyId: string) => {
    try {
      await api.deleteStory(storyId);
      setToastMessage('கதை வெற்றிகரமாக நீக்கப்பட்டது.');
      setFeedStories(prev => prev.filter(s => s.id !== storyId));
      if (activeStoryDetail?.id === storyId) {
        setActiveStoryDetail(null);
      }
    } catch (err: any) {
      setToastMessage(err.message || 'நீக்குவதில் பிழை.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1F2421] font-['Noto_Sans_Tamil',sans-serif] pb-20 md:pb-12">
      {/* Top Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={tab => {
          setEditingStory(null);
          setInitialSTTText('');
          setInitialSTTAudioUrl('');
          setCurrentTab(tab);
        }}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenSTTModal={() => setIsSTTModalOpen(true)}
      />

      {/* Main Page Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        {/* TAB 1: HOME FEED */}
        {currentTab === 'home' && (
          <div className="max-w-2xl mx-auto py-2">
            {/* Cultural Hero Header */}
            <div className="bg-linear-to-r from-[#7B1113] via-[#881337] to-[#580F15] text-[#FAF6EE] rounded-3xl p-6 sm:p-8 mb-6 shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-300 via-transparent to-transparent" />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF6EE]/15 text-amber-200 backdrop-blur-xs mb-3 border border-amber-200/20">
                  <Feather className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>நினைவோசை டிஜிட்டல் ஆவணக் காப்பகம்</span>
                </span>
                <h1 className="font-['Noto_Serif_Tamil',serif] font-bold text-2xl sm:text-3xl leading-snug mb-2 text-[#FDFBF7]">
                  நினைவுகளைப் பாதுகாப்போம்; மரபை அடுத்த தலைமுறைக்குக் கொண்டு செல்வோம்.
                </h1>
                <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed max-w-xl mb-4">
                  தமிழ் மண்ணின் கிராமிய கதைகள், விவசாய அறிவு, திருவிழா மரபுகள் மற்றும் முதியவர்களின் வாய்மொழி நினைவுகளைப் பாதுகாக்கும் சமூகம் சார்ந்த வரலாற்றுத் தளம்.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      if (user) {
                        setCurrentTab('create');
                      } else {
                        openAuthModal('login');
                      }
                    }}
                    className="px-4 py-2 bg-[#C5A059] hover:bg-[#B38F38] text-[#1F2421] font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>உங்கள் ஊர்க் கதையைப் பகிருங்கள்</span>
                  </button>

                  <button
                    onClick={() => setCurrentTab('search')}
                    className="px-4 py-2 bg-[#FAF6EE]/15 hover:bg-[#FAF6EE]/25 text-[#FAF6EE] font-semibold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-colors border border-[#FAF6EE]/20"
                  >
                    <Compass className="w-4 h-4" />
                    <span>களஞ்சியத்தை ஆராய்க</span>
                  </button>

                  <button
                    onClick={() => setIsSTTModalOpen(true)}
                    className="px-4 py-2 bg-linear-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-[#FAF6EE] font-semibold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-colors border border-amber-300/30 shadow-xs"
                    title="பேச்சை உரையாக மாற்று (Speech-to-Text)"
                  >
                    <Mic className="w-4 h-4 text-amber-200" />
                    <span>குரல் உரைமாற்றி</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Category Quick Filter Scroller */}
            <div className="mb-6 overflow-x-auto pb-2 scrollbar-none">
              <div className="flex items-center gap-2 min-w-max">
                <button
                  onClick={() => setFeedCategory('அனைத்தும்')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    feedCategory === 'அனைத்தும்'
                      ? 'bg-[#7B1113] text-[#FDFBF7] shadow-xs'
                      : 'bg-[#FAF6EE] text-[#5C5346] hover:bg-[#EFE7D8] border border-[#E8DEC8]'
                  }`}
                >
                  அனைத்துக் கதைகளும்
                </button>
                {TAMIL_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFeedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      feedCategory === cat
                        ? 'bg-[#7B1113] text-[#FDFBF7] shadow-xs'
                        : 'bg-[#FAF6EE] text-[#5C5346] hover:bg-[#EFE7D8] border border-[#E8DEC8]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Stories Feed List */}
            {isLoadingFeed ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-3 border-[#7B1113] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-[#786C5E]">கதைகள் பதிவேற்றப்படுகின்றன...</p>
              </div>
            ) : feedStories.length === 0 ? (
              <div className="py-16 text-center bg-[#FAF6EE] border border-dashed border-[#E2D9CE] rounded-2xl p-6">
                <BookOpen className="w-10 h-10 text-[#C5A059] mx-auto mb-2" />
                <h3 className="font-bold text-base text-[#1F2421] mb-1">
                  இப்பிரிவில் கதைகள் இல்லை
                </h3>
                <p className="text-xs text-[#786C5E] max-w-sm mx-auto mb-4">
                  இத்தலைப்பில் முதல் கதையைப் பதிவு செய்து நமது பண்பாட்டு ஆவணக் காப்பகத்தைத் தொடங்குங்கள்!
                </p>
                <button
                  onClick={() => {
                    if (user) {
                      setCurrentTab('create');
                    } else {
                      openAuthModal('login');
                    }
                  }}
                  className="px-4 py-2 bg-[#7B1113] text-[#FDFBF7] rounded-xl text-xs font-semibold"
                >
                  கதையைச் சேர்
                </button>
              </div>
            ) : (
              <div>
                <div className="space-y-6">
                  {feedStories.map(story => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      onOpenDetail={s => setActiveStoryDetail(s)}
                      onOpenReport={s => setReportingStory(s)}
                      onEditStory={handleEditStory}
                      onDeleteStory={handleDeleteFeedStory}
                      onShowToast={msg => setToastMessage(msg)}
                    />
                  ))}
                </div>

                {/* Incremental / Pagination button */}
                {feedPage < totalPages && (
                  <div className="text-center pt-6 pb-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-5 py-2.5 bg-[#FAF6EE] hover:bg-[#EFE7D8] border border-[#E8DEC8] text-[#7B1113] font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      <span>மேலும் கதைகளைக் காட்டு</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SEARCH & REGIONAL ARCHIVE */}
        {currentTab === 'search' && (
          <SearchFilter
            onOpenDetail={s => setActiveStoryDetail(s)}
            onOpenReport={s => setReportingStory(s)}
            onShowToast={msg => setToastMessage(msg)}
          />
        )}

        {/* TAB 3: CREATE / EDIT STORY */}
        {currentTab === 'create' && (
          <StoryForm
            initialStory={editingStory}
            initialText={initialSTTText}
            initialAudioUrl={initialSTTAudioUrl}
            onSuccess={story => {
              setEditingStory(null);
              setInitialSTTText('');
              setInitialSTTAudioUrl('');
              setCurrentTab('home');
              fetchFeed(1, false);
              setActiveStoryDetail(story);
            }}
            onCancel={() => {
              setEditingStory(null);
              setInitialSTTText('');
              setInitialSTTAudioUrl('');
              setCurrentTab('home');
            }}
            onShowToast={msg => setToastMessage(msg)}
          />
        )}

        {/* TAB 4: SAVED STORIES */}
        {currentTab === 'saved' && (
          <SavedView
            onOpenDetail={s => setActiveStoryDetail(s)}
            onOpenReport={s => setReportingStory(s)}
            onExploreStories={() => setCurrentTab('search')}
            onShowToast={msg => setToastMessage(msg)}
          />
        )}

        {/* TAB 5: PROFILE & USER STORIES */}
        {currentTab === 'profile' && (
          <ProfileView
            onOpenDetail={s => setActiveStoryDetail(s)}
            onOpenReport={s => setReportingStory(s)}
            onEditStory={handleEditStory}
            onNewStory={() => {
              setEditingStory(null);
              setCurrentTab('create');
            }}
            onShowToast={msg => setToastMessage(msg)}
          />
        )}
      </main>

      {/* Footer (Tamil-only) */}
      <footer className="mt-16 border-t border-[#E8DEC8] bg-[#FAF6EE] py-8 text-center text-xs text-[#5C5346]">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 font-['Noto_Serif_Tamil',serif] font-bold text-base text-[#7B1113]">
            <Feather className="w-4 h-4 text-[#C5A059]" />
            <span>நினைவோசை</span>
          </div>
          <p className="font-medium">
            “நினைவுகளைப் பாதுகாப்போம்; மரபை அடுத்த தலைமுறைக்குக் கொண்டு செல்வோம்.”
          </p>
          <p className="text-[11px] text-[#786C5E]">
            தமிழ் வாய்மொழி வரலாற்றுப் பெட்டகம் • அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={tab => {
          setEditingStory(null);
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Floating Modals */}
      {activeStoryDetail && (
        <StoryDetailModal
          story={activeStoryDetail}
          onClose={() => setActiveStoryDetail(null)}
          onOpenReport={s => setReportingStory(s)}
          onShowToast={msg => setToastMessage(msg)}
        />
      )}

      {reportingStory && (
        <ReportModal
          story={reportingStory}
          onClose={() => setReportingStory(null)}
          onShowToast={msg => setToastMessage(msg)}
        />
      )}

      {isAdminModalOpen && (
        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          onShowToast={msg => setToastMessage(msg)}
        />
      )}

      {/* Floating Quick Speech-to-Text Button */}
      <button
        onClick={() => setIsSTTModalOpen(true)}
        className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-30 p-3 sm:px-4 sm:py-2.5 rounded-2xl bg-linear-to-tr from-[#7B1113] to-[#9E1A1D] hover:scale-105 text-[#FDFBF7] shadow-xl border border-[#C5A059]/40 flex items-center gap-2 transition-all active:scale-95 group"
        title="பேச்சை உரையாக மாற்று (Speech-to-Text)"
      >
        <div className="relative">
          <Mic className="w-5 h-5 text-amber-200" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <span className="hidden sm:inline text-xs font-bold text-amber-50">
          குரல் உரைமாற்றி
        </span>
      </button>

      {/* Dedicated Speech to Text Modal */}
      <SpeechToTextModal
        isOpen={isSTTModalOpen}
        onClose={() => setIsSTTModalOpen(false)}
        onUseTextInStory={(text, audioUrl) => {
          setInitialSTTText(text);
          setInitialSTTAudioUrl(audioUrl || '');
          setEditingStory(null);
          setCurrentTab('create');
          setToastMessage('உரை பதிவுப் படிவத்தில் சேர்க்கப்பட்டது!');
        }}
        onShowToast={msg => setToastMessage(msg)}
      />

      <AuthModal onShowToast={msg => setToastMessage(msg)} />

      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
