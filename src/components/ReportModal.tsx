import React, { useState } from 'react';
import { Story } from '../types.ts';
import { api } from '../services/api.ts';
import { REPORT_REASONS } from '../constants/tamilData.ts';
import { X, AlertCircle, Send, Loader2 } from 'lucide-react';

interface ReportModalProps {
  story: Story | null;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ story, onClose, onShowToast }) => {
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!story) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.reportStory(story.id, selectedReason, details);
      onShowToast(res.message);
      onClose();
    } catch (err: any) {
      onShowToast(err.message || 'புகார் அனுப்புவதில் பிழை.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1F2421]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF6EE] border border-[#E8DEC8] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#E2D9CE] text-[#5C5346] transition-colors"
          title="மூடு"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-amber-700" />
          <h3 className="font-['Noto_Serif_Tamil',serif] font-bold text-lg text-[#7B1113]">
            உள்ளடக்கப் புகார் செய்க
          </h3>
        </div>

        <p className="text-xs text-[#5C5346] mb-4">
          கதை: <span className="font-bold text-[#1F2421]">"{story.title}"</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-2">
              புகாருக்கான முதன்மைக் காரணம் *
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map(reason => (
                <label
                  key={reason}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs ${
                    selectedReason === reason
                      ? 'border-[#7B1113] bg-[#7B1113]/5 font-semibold text-[#1F2421]'
                      : 'border-[#E2D9CE] text-[#5C5346] hover:bg-[#EFE7D8]'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-[#7B1113]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#7B1113] uppercase tracking-wider mb-1">
              கூடுதல் விவரங்கள் (விருப்பத்தேர்வு)
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="ஏன் இந்த உள்ளடக்கம் நீக்கப்பட வேண்டும் அல்லது சரிபார்க்கப்பட வேண்டும் என்பதைக் குறிப்பிடுக..."
              className="w-full bg-[#FDFBF7] border border-[#E2D9CE] rounded-xl p-3 text-xs text-[#1F2421] placeholder-[#786C5E] focus:outline-none focus:border-[#7B1113]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E2D9CE] hover:bg-[#EFE7D8] text-[#5C5346] rounded-xl text-xs font-semibold"
            >
              ரத்து செய்
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>புகாரை அனுப்புக</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
