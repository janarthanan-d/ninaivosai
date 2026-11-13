import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Feather, BookOpen, Search, PlusCircle, Bookmark, User as UserIcon, Shield, LogOut, Sparkles, Mic } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAdminModal: () => void;
  onOpenSTTModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenAdminModal, onOpenSTTModal }) => {
  const { user, logout, openAuthModal } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6EE]/95 backdrop-blur-md border-b border-[#E8DEC8] shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <button
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-3 text-left group focus:outline-none"
          title="நினைவோசை முகப்பு"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-[#7B1113] to-[#4A0A0C] flex items-center justify-center text-[#F5EEDB] shadow-md group-hover:scale-105 transition-transform duration-200">
            <Feather className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Noto_Serif_Tamil',serif] font-bold text-xl sm:text-2xl text-[#7B1113] tracking-wide">
                நினைவோசை
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-[#7B1113]/10 text-[#7B1113] rounded-full border border-[#7B1113]/20">
                <Sparkles className="w-3 h-3 text-[#C5A059]" />
                தமிழ் வாய்மொழி வரலாற்றுப் பெட்டகம்
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#5C5346] font-medium hidden sm:block">
              நினைவுகளைப் பாதுகாப்போம்; மரபை அடுத்த தலைமுறைக்குக் கொண்டு செல்வோம்.
            </p>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              currentTab === 'home'
                ? 'bg-[#7B1113] text-[#FDFBF7] shadow-xs'
                : 'text-[#3D352E] hover:bg-[#EFE7D8]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>முகப்பு</span>
          </button>

          <button
            onClick={() => onSelectTab('search')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              currentTab === 'search'
                ? 'bg-[#7B1113] text-[#FDFBF7] shadow-xs'
                : 'text-[#3D352E] hover:bg-[#EFE7D8]'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>தேடல் & களஞ்சியம்</span>
          </button>

          {/* Dedicated Speech to Text Button */}
          <button
            onClick={onOpenSTTModal}
            className="px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 bg-[#7B1113]/10 hover:bg-[#7B1113]/20 text-[#7B1113] border border-[#7B1113]/20"
            title="பேச்சை உரையாக மாற்று (Speech-to-Text)"
          >
            <Mic className="w-4 h-4 text-[#C5A059]" />
            <span>குரல் உரைமாற்றி</span>
          </button>

          <button
            onClick={() => onSelectTab('create')}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === 'create'
                ? 'bg-[#C5A059] text-[#1F2421] shadow-xs'
                : 'bg-[#7B1113] text-[#FDFBF7] hover:bg-[#600E10]'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>கதையைச் சேர்</span>
          </button>

          <button
            onClick={() => {
              if (user) {
                onSelectTab('saved');
              } else {
                openAuthModal('login');
              }
            }}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              currentTab === 'saved'
                ? 'bg-[#7B1113] text-[#FDFBF7] shadow-xs'
                : 'text-[#3D352E] hover:bg-[#EFE7D8]'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>சேமித்தவை</span>
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={onOpenAdminModal}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 text-rose-800 bg-rose-100/60 hover:bg-rose-100 border border-rose-200"
              title="நிர்வாகக் கட்டுப்பாட்டுப் பலகை"
            >
              <Shield className="w-4 h-4" />
              <span>நிர்வாகம்</span>
            </button>
          )}
        </nav>

        {/* User Account / Auth Actions & Mobile STT */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile STT trigger */}
          <button
            onClick={onOpenSTTModal}
            className="md:hidden p-2 rounded-lg bg-[#7B1113]/10 text-[#7B1113] hover:bg-[#7B1113]/20 transition-colors"
            title="குரல் உரைமாற்றி"
          >
            <Mic className="w-4 h-4 text-[#C5A059]" />
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectTab('profile')}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${
                  currentTab === 'profile'
                    ? 'border-[#7B1113] bg-[#7B1113]/10 text-[#7B1113]'
                    : 'border-[#E2D9CE] hover:bg-[#EFE7D8] text-[#2D2A26]'
                }`}
                title="எனது சுயவிவரம்"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-[#C5A059]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#7B1113] text-amber-100 flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <span className="block text-xs font-bold truncate max-w-[110px] leading-tight">
                    {user.name}
                  </span>
                  <span className="block text-[10px] text-[#786C5E] leading-tight">
                    {user.district || 'தமிழ்நாடு'}
                  </span>
                </div>
              </button>

              <button
                onClick={() => logout()}
                className="p-2 rounded-lg text-[#786C5E] hover:text-[#7B1113] hover:bg-rose-50 transition-colors"
                title="வெளியேறு"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openAuthModal('login')}
                className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-[#7B1113] hover:bg-[#7B1113]/10 transition-colors"
              >
                உள்நுழை
              </button>
              <button
                onClick={() => openAuthModal('register')}
                className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-[#7B1113] hover:bg-[#600E10] text-[#FDFBF7] shadow-xs transition-colors"
              >
                பதிவு செய்
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
