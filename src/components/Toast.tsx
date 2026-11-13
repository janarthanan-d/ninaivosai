import React, { useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-18 md:bottom-6 right-4 z-50 max-w-sm bg-[#1F2421] text-[#FAF6EE] px-4 py-3 rounded-xl shadow-xl flex items-center justify-between gap-3 border border-[#C5A059]/40 animate-in slide-in-from-bottom-3 duration-200 text-xs sm:text-sm">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-[#C5A059] shrink-0" />
        <span className="leading-snug">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="text-[#FAF6EE]/70 hover:text-[#FAF6EE] p-0.5 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
