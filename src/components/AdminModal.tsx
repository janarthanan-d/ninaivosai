import React, { useState, useEffect } from 'react';
import { Report } from '../types.ts';
import { api } from '../services/api.ts';
import { X, Shield, EyeOff, Eye, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.getReports();
      setReports(res.reports || []);
    } catch {
      onShowToast('புகார்களைப் பெறுவதில் பிழை.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleModerate = async (reportId: string, action: 'hide' | 'unhide' | 'dismiss') => {
    try {
      const res = await api.moderateStory(reportId, action);
      onShowToast(res.message);
      fetchReports();
    } catch (err: any) {
      onShowToast(err.message || 'நடவடிக்கை எடுப்பதில் பிழை.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1F2421]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF6EE] border border-[#E8DEC8] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8DEC8] bg-[#F5EEDB]/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-800" />
            <h3 className="font-['Noto_Serif_Tamil',serif] font-bold text-lg text-[#7B1113]">
              நிர்வாகக் கட்டுப்பாட்டுப் பலகை (உள்ளடக்க ஆய்வு)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#E2D9CE] text-[#5C5346] transition-colors"
            title="மூடு"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-4">
            <p className="text-xs text-[#5C5346]">
              பயனர்களால் புகார் அளிக்கப்பட்ட கதைகளின் பட்டியல். ஆய்வு செய்து உள்ளடக்கத்தை மறைக்கவோ அல்லது புகாரைத் தள்ளுபடி செய்யவோ முடியும்.
            </p>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#7B1113] mx-auto mb-2" />
              <p className="text-xs text-[#786C5E]">புகார்கள் பெறப்படுகின்றன...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center bg-[#FDFBF7] rounded-xl border border-dashed border-[#E2D9CE]">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-[#1F2421]">புதிய புகார்கள் எதுவும் இல்லை</p>
              <p className="text-xs text-[#786C5E] mt-0.5">அனைத்துக் கதைகளும் பாதுகாப்பாகவும் நன்னெறியுடனும் உள்ளன.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(rep => (
                <div key={rep.id} className="p-4 rounded-xl bg-[#FDFBF7] border border-[#E8DEC8] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        {rep.status === 'pending' ? 'ஆய்வு தேவை' : 'ஆய்வு செய்யப்பட்டது'}
                      </span>
                      <h4 className="font-bold text-sm text-[#1F2421] mt-1">
                        கதை: {rep.storyTitle}
                      </h4>
                    </div>
                    <span className="text-[10px] text-[#786C5E]">
                      {new Date(rep.createdAt).toLocaleDateString('ta-IN')}
                    </span>
                  </div>

                  <div className="text-xs text-[#5C5346]">
                    <span className="font-bold text-[#7B1113]">காரணம்: </span>
                    <span>{rep.reason}</span>
                  </div>

                  {rep.details && (
                    <div className="text-xs text-[#3D352E] bg-[#FAF6EE] p-2.5 rounded-lg border border-[#EFE7D8]">
                      {rep.details}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#EFE7D8]">
                    <button
                      onClick={() => handleModerate(rep.id, 'hide')}
                      className="px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-900 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>கதையை மறை</span>
                    </button>

                    <button
                      onClick={() => handleModerate(rep.id, 'unhide')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>மீண்டும் காட்டு</span>
                    </button>

                    <button
                      onClick={() => handleModerate(rep.id, 'dismiss')}
                      className="px-3 py-1.5 rounded-lg bg-[#EFE7D8] hover:bg-[#E2D9CE] text-[#5C5346] text-xs font-semibold transition-colors"
                    >
                      தள்ளுபடி செய்
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
