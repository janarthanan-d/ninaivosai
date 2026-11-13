import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Home, Search, PlusCircle, Bookmark, User as UserIcon } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { user, openAuthModal } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF6EE]/98 backdrop-blur-md border-t border-[#E8DEC8] px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {/* 1. முகப்பு */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            currentTab === 'home'
              ? 'text-[#7B1113] font-bold'
              : 'text-[#6B5E4F] hover:text-[#2D2A26]'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">முகப்பு</span>
        </button>

        {/* 2. தேடல் */}
        <button
          onClick={() => onSelectTab('search')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            currentTab === 'search'
              ? 'text-[#7B1113] font-bold'
              : 'text-[#6B5E4F] hover:text-[#2D2A26]'
          }`}
        >
          <Search className={`w-5 h-5 ${currentTab === 'search' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">தேடல்</span>
        </button>

        {/* 3. சேர் */}
        <button
          onClick={() => {
            if (user) {
              onSelectTab('create');
            } else {
              openAuthModal('login');
            }
          }}
          className="flex flex-col items-center justify-center -mt-4"
        >
          <div className="w-12 h-12 rounded-full bg-linear-to-tr from-[#7B1113] to-[#9E1A1D] text-[#FDFBF7] flex items-center justify-center shadow-md active:scale-95 transition-transform">
            <PlusCircle className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold text-[#7B1113]">சேர்</span>
        </button>

        {/* 4. சேமித்தவை */}
        <button
          onClick={() => {
            if (user) {
              onSelectTab('saved');
            } else {
              openAuthModal('login');
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            currentTab === 'saved'
              ? 'text-[#7B1113] font-bold'
              : 'text-[#6B5E4F] hover:text-[#2D2A26]'
          }`}
        >
          <Bookmark className={`w-5 h-5 ${currentTab === 'saved' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">சேமித்தவை</span>
        </button>

        {/* 5. சுயவிவரம் */}
        <button
          onClick={() => {
            if (user) {
              onSelectTab('profile');
            } else {
              openAuthModal('login');
            }
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            currentTab === 'profile'
              ? 'text-[#7B1113] font-bold'
              : 'text-[#6B5E4F] hover:text-[#2D2A26]'
          }`}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className={`w-5 h-5 rounded-full object-cover border ${
                currentTab === 'profile' ? 'border-[#7B1113]' : 'border-transparent'
              }`}
            />
          ) : (
            <UserIcon className={`w-5 h-5 ${currentTab === 'profile' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          )}
          <span className="text-[10px] mt-0.5 tracking-tight">சுயவிவரம்</span>
        </button>
      </div>
    </nav>
  );
};
