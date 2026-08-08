import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Search, CheckCircle, X, Sparkles, User, Key, Award, Clock } from 'lucide-react';
import { verifyAndFetchPass, setPassVerified, SavedPass } from '../lib/firebase';

interface VerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const VerifyModal: React.FC<VerifyModalProps> = ({
  isOpen,
  onClose,
  initialCode = ''
}) => {
  const [passCodeInput, setPassCodeInput] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ pass: SavedPass | null; message: string; isFound: boolean } | null>(null);
  const [verifyingStatus, setVerifyingStatus] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passCodeInput.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await verifyAndFetchPass(passCodeInput);
      setResult(res);
    } catch (err: any) {
      setResult({
        pass: null,
        message: 'Failed to query database: ' + (err.message || 'Unknown error'),
        isFound: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkVerified = async () => {
    if (!result?.pass?.id) return;
    setVerifyingStatus(true);
    const success = await setPassVerified(result.pass.id, 'Official Organizer');
    if (success) {
      setResult({
        ...result,
        pass: {
          ...result.pass,
          verified: true,
          verifiedBy: 'Official Organizer'
        },
        message: 'Pass has been officially marked as VERIFIED in Firestore database!'
      });
    }
    setVerifyingStatus(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0d1f18] border-2 border-[#F5D033] rounded-2xl shadow-2xl overflow-hidden font-space-mono text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F5D033]/20 border border-[#F5D033]/50 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-[#F5D033]" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wider text-[#F5D033] uppercase">
                Pass Verification
              </h3>
              <p className="text-xs text-white/60">
                Official Goa Hacker House Database
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

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Search Form */}
          <form onSubmit={handleVerify} className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#F5D033]">
              Enter Pass Code or ID Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={passCodeInput}
                  onChange={(e) => setPassCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. GOA-8F92A"
                  className="w-full px-4 py-3 bg-black/60 border-2 border-white/20 rounded-xl text-sm font-bold text-white placeholder-white/30 focus:outline-none focus:border-[#F5D033] uppercase tracking-wider font-mono"
                />
                <Key className="absolute right-3.5 top-3.5 w-4 h-4 text-white/40" />
              </div>
              <button
                type="submit"
                disabled={loading || !passCodeInput.trim()}
                className="px-5 py-3 bg-[#F5D033] hover:bg-[#ffe252] disabled:opacity-50 text-[#045E38] font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg active:scale-95 whitespace-nowrap"
              >
                {loading ? (
                  <span className="inline-block animate-spin">⌛</span>
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Verify
              </button>
            </div>
          </form>

          {/* Quick suggestions */}
          {!result && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-xs space-y-2 text-white/80">
              <div className="font-bold text-[#F5D033] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Quick Verification Tip:
              </div>
              <p>
                Every generated Hacker House pass includes a unique <code className="bg-black/60 px-1.5 py-0.5 rounded text-[#FF007F]">GOA-XXXXX</code> verification code stored securely in Firestore.
              </p>
            </div>
          )}

          {/* Result Area */}
          {result && (
            <div className="space-y-4 animate-fadeIn">
              {result.isFound && result.pass ? (
                <div className="bg-[#052b1d] border-2 border-[#10b981] rounded-xl p-4 sm:p-5 space-y-4 shadow-xl relative overflow-hidden">
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 bg-[#10b981]/20 border border-[#10b981] rounded-full text-[10px] font-bold text-[#10b981] uppercase tracking-widest">
                    <CheckCircle className="w-3 h-3" /> VERIFIED PASS
                  </div>

                  <div className="flex items-center gap-4">
                    {result.pass.imageUrl ? (
                      <img
                        src={result.pass.imageUrl}
                        alt="Holder"
                        className="w-16 h-16 rounded-xl object-cover border-2 border-[#10b981] shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-black/40 border-2 border-[#10b981] flex items-center justify-center text-[#F5D033]">
                        <User className="w-8 h-8" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="text-xs text-[#10b981] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> {result.pass.role || 'HACKER'} PASS
                      </div>
                      <h4 className="text-lg font-black text-white tracking-wide">
                        {result.pass.holderName}
                      </h4>
                      <p className="text-xs text-white/70">
                        @{result.pass.handle || 'hacker'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/10 font-mono">
                    <div className="bg-black/40 p-2 rounded-lg">
                      <span className="text-white/50 block text-[10px] uppercase">Pass Code</span>
                      <span className="text-[#F5D033] font-bold">{result.pass.passCode}</span>
                    </div>
                    <div className="bg-black/40 p-2 rounded-lg">
                      <span className="text-white/50 block text-[10px] uppercase">Track</span>
                      <span className="text-white font-bold">{result.pass.track || 'AI & Agents'}</span>
                    </div>
                  </div>

                  {result.pass.motto && (
                    <p className="text-xs italic text-white/80 bg-black/30 p-2.5 rounded-lg border border-white/5">
                      "{result.pass.motto}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-white/60 pt-2 border-t border-white/10">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Issued: {result.pass.creatorEmail || 'Hacker House System'}
                    </span>
                    {!result.pass.verified && (
                      <button
                        type="button"
                        onClick={handleMarkVerified}
                        disabled={verifyingStatus}
                        className="px-3 py-1 bg-[#10b981] hover:bg-[#059669] text-black font-black rounded-lg text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        {verifyingStatus ? 'Updating...' : 'Stamp Official Seal'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-red-950/40 border-2 border-red-500/50 rounded-xl p-4 text-center space-y-2">
                  <ShieldAlert className="w-10 h-10 text-red-500 mx-auto" />
                  <h4 className="text-sm font-black text-red-400 uppercase tracking-wider">
                    Unverified / Invalid Pass
                  </h4>
                  <p className="text-xs text-red-200/80">
                    {result.message}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/60 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
          <span>Goa Hacker House 2026</span>
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
