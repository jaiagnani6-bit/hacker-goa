import React, { useEffect, useState } from 'react';
import { X, Database, ShieldCheck, User, Sparkles, CheckCircle, RefreshCw } from 'lucide-react';
import { fetchRecentPasses, SavedPass } from '../lib/firebase';

interface PassesDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPassToVerify: (passCode: string) => void;
}

export const PassesDatabaseModal: React.FC<PassesDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSelectPassToVerify,
}) => {
  const [passes, setPasses] = useState<SavedPass[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const recent = await fetchRecentPasses();
      setPasses(recent);
    } catch (err) {
      console.error('Failed loading passes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0d1f18] border-2 border-[#F5D033] rounded-2xl shadow-2xl overflow-hidden font-space-mono text-white max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F5D033]/20 border border-[#F5D033]/50 rounded-xl">
              <Database className="w-6 h-6 text-[#F5D033]" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wider text-[#F5D033] uppercase">
                Hacker House Database
              </h3>
              <p className="text-xs text-white/60">
                Firestore Verified Passes Records
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Refresh Bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-black/30 border-b border-white/10 text-xs">
          <span className="text-white/60 font-bold uppercase tracking-wider">Recent Passes</span>
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/80 transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* List Body */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-12 text-center text-white/60 space-y-2">
              <div className="w-8 h-8 border-2 border-[#F5D033] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Connecting to Firestore database...</p>
            </div>
          ) : passes.length === 0 ? (
            <div className="py-12 text-center text-white/50 space-y-2 bg-white/5 rounded-xl border border-white/10">
              <Sparkles className="w-8 h-8 text-[#F5D033] mx-auto opacity-50" />
              <p className="text-sm font-bold text-white">No pass records found in database.</p>
              <p className="text-xs">Create a pass and save it to register it in Firestore!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {passes.map((pass) => (
                <div
                  key={pass.id || pass.passCode}
                  className="bg-black/50 border border-white/15 hover:border-[#F5D033] rounded-xl p-3.5 transition-all space-y-3 relative group"
                >
                  <div className="flex items-center gap-3">
                    {pass.imageUrl ? (
                      <img
                        src={pass.imageUrl}
                        alt={pass.holderName}
                        className="w-12 h-12 rounded-lg object-cover border border-white/20"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-[#F5D033]">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 text-[10px] text-[#F5D033] font-bold uppercase tracking-wider">
                        <span>{pass.role || 'ATTENDEE'}</span>
                        {pass.verified && (
                          <CheckCircle className="w-3 h-3 text-[#10b981]" />
                        )}
                      </div>
                      <h4 className="text-sm font-black text-white truncate">
                        {pass.holderName}
                      </h4>
                      <p className="text-[11px] text-white/60 truncate font-mono">
                        Code: <span className="text-[#F5D033] font-bold">{pass.passCode}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/10 font-mono">
                    <span className="text-white/50 text-[10px]">
                      {pass.track || 'AI & Agents'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectPassToVerify(pass.passCode);
                      }}
                      className="px-2.5 py-1 bg-[#10b981]/20 hover:bg-[#10b981] text-[#10b981] hover:text-black font-bold rounded-md transition-colors cursor-pointer flex items-center gap-1 text-[10px] uppercase"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/60 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
          <span>Firestore DB Active</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
