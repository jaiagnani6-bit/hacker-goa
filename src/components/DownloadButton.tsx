import React, { useState } from 'react';
import { Download, Copy, Check, Image as ImageIcon } from 'lucide-react';
import { getCanvasBlob } from '../lib/compositing';

interface DownloadButtonProps {
  canvas: HTMLCanvasElement | null;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ canvas }) => {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = async () => {
    if (!canvas) return;
    setDownloading(true);
    setDownloadSuccess(false);

    try {
      const blob = await getCanvasBlob(canvas);
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `HH_Goa_2026_PFP_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopy = async () => {
    if (!canvas) return;
    try {
      const blob = await getCanvasBlob(canvas);
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } else {
        alert('Clipboard image copy is not supported on this browser. Use Download PNG instead.');
      }
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
      alert('Could not copy image to clipboard. Please use Download PNG.');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
      {/* Primary Download Button */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={!canvas || downloading}
        className={`flex-1 w-full py-5 px-6 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] ${
          downloadSuccess
            ? 'bg-emerald-500 text-white shadow-emerald-500/20'
            : 'bg-yellow-400 text-[#0B3D2E] shadow-[0_10px_30px_rgba(250,204,21,0.3)] hover:scale-[1.02]'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {downloadSuccess ? (
          <>
            <Check className="w-5 h-5 text-[#0B3D2E] stroke-[3]" />
            Downloaded High-Res PNG!
          </>
        ) : (
          <>
            <Download className="w-5 h-5 text-[#0B3D2E] stroke-[2.5]" />
            {downloading ? 'Preparing PNG...' : 'Download PNG'}
          </>
        )}
      </button>

      {/* Copy Image to Clipboard */}
      <button
        type="button"
        onClick={handleCopy}
        disabled={!canvas}
        className="w-full sm:w-auto py-5 px-6 bg-white/5 hover:bg-white/10 text-white border border-white/20 rounded-2xl font-bold text-xs uppercase tracking-widest backdrop-blur-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
        title="Copy PNG image directly to clipboard"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-300" />
            Copied Image!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-yellow-400" />
            Copy Image
          </>
        )}
      </button>
    </div>
  );
};
