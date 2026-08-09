import React, { useState } from 'react';
import { Share2, ExternalLink, Loader2, Check, AlertTriangle, Copy } from 'lucide-react';
import { getCanvasBlob, getCanvasDataUrl } from '../lib/compositing';
import { ShareResponse } from '../types';

interface ShareButtonProps {
  canvas: HTMLCanvasElement | null;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ canvas }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareData, setShareData] = useState<ShareResponse | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const handleShareToX = async () => {
    if (!canvas) return;
    setIsSharing(true);
    setShareError(null);

    let shareUrl = '';
    const captionText = 'Just got my #FrameInGoa PFP for HH Goa 2026! 🌴☀️ See you in Goa! (28 - 31 Oct 2026)';

    try {
      const dataUrl = getCanvasDataUrl(canvas);

      // Upload PNG blob to backend to obtain unique share URL with Open Graph preview tags
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (res.ok) {
        const data: ShareResponse = await res.json();
        if (data.success && data.shareUrl) {
          shareUrl = data.shareUrl;
          setShareData(data);
        }
      }
    } catch (err) {
      console.warn('Backend upload share route error, using fallback:', err);
      setShareError('Server link preview offline, opening draft tweet directly.');
    }

    // Construct X (Twitter) intent URL
    const tweetText = shareUrl ? `${captionText}\n\n${shareUrl}` : captionText;
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

    // Open X Intent
    window.open(intentUrl, '_blank', 'noopener,noreferrer');

    setIsSharing(false);
  };

  const copyShareLink = async () => {
    if (!shareData?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareData.shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Primary Share to X Button */}
      <button
        type="button"
        onClick={handleShareToX}
        disabled={!canvas || isSharing}
        className="w-full py-5 px-6 bg-white/5 border border-white/20 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-2xl backdrop-blur-xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
      >
        {isSharing ? (
          <>
            <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
            Generating #FrameInGoa Share Link...
          </>
        ) : (
          <>
            {/* X / Twitter Icon */}
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>Share to X</span>
            <ExternalLink className="w-4 h-4 text-white/60" />
          </>
        )}
      </button>

      {/* Share Link Result Banner */}
      {shareData && (
        <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-yellow-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              Unique Open Graph Link Generated!
            </span>
            <span className="text-emerald-300/70 font-mono text-[10px]">Expires in 7 days</span>
          </div>

          <div className="flex items-center gap-2 bg-black/40 rounded-xl p-2 border border-white/10">
            <input
              type="text"
              readOnly
              value={shareData.shareUrl}
              className="bg-transparent text-xs text-emerald-100 font-mono flex-1 outline-none truncate"
            />
            <button
              type="button"
              onClick={copyShareLink}
              className="px-3 py-1.5 bg-yellow-400 text-[#0B3D2E] font-black text-xs rounded-lg hover:bg-yellow-300 flex items-center gap-1 shrink-0 uppercase tracking-wider"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Fallback Notice */}
      {shareError && (
        <div className="bg-yellow-950/60 border border-yellow-500/40 rounded-xl p-3 flex items-start gap-2 text-xs text-yellow-200">
          <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <span>{shareError}</span>
        </div>
      )}
    </div>
  );
};
