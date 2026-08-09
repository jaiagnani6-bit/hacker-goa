import React, { useState } from 'react';
import { X, Play, Link as LinkIcon, Upload, Sparkles, Check, RefreshCw } from 'lucide-react';

interface HypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HypeModal: React.FC<HypeModalProps> = ({ isOpen, onClose }) => {
  // Default to public folder video /hhgoa.mp4
  const [videoSource, setVideoSource] = useState<string>('/hhgoa.mp4');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [isYoutube, setIsYoutube] = useState<boolean>(false);
  const [showInputBar, setShowInputBar] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);

  if (!isOpen) return null;

  const processUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return;

    setHasError(false);
    let embedUrl = trimmed;
    let youtubeFlag = false;

    // Check YouTube formats
    if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      youtubeFlag = true;
      let videoId = '';

      if (trimmed.includes('v=')) {
        videoId = trimmed.split('v=')[1]?.split('&')[0] || '';
      } else if (trimmed.includes('youtu.be/')) {
        videoId = trimmed.split('youtu.be/')[1]?.split('?')[0] || '';
      } else if (trimmed.includes('/embed/')) {
        videoId = trimmed.split('/embed/')[1]?.split('?')[0] || '';
      } else if (trimmed.includes('/shorts/')) {
        videoId = trimmed.split('/shorts/')[1]?.split('?')[0] || '';
      }

      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
    }

    setVideoSource(embedUrl);
    setIsYoutube(youtubeFlag);
    setStatusMsg('Video source updated!');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    processUrl(inputUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHasError(false);
      const blobUrl = URL.createObjectURL(file);
      setVideoSource(blobUrl);
      setIsYoutube(false);
      setStatusMsg(`Loaded local video: ${file.name}`);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        processUrl(text);
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  const handleVideoError = () => {
    console.warn(`Could not load video source: ${videoSource}`);
    setHasError(true);
  };

  const loadDemoYoutube = () => {
    setHasError(false);
    setIsYoutube(true);
    setVideoSource('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1');
    setStatusMsg('Playing demo promo video!');
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn font-space-mono">
      <div className="relative w-full max-w-4xl bg-[#091f16] rounded-2xl overflow-hidden border-2 border-[#F5D033] shadow-2xl flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#045E38] border-b border-white/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#F5D033]/20 border border-[#F5D033]/50 rounded-xl">
              <Play className="w-5 h-5 text-[#F5D033] fill-[#F5D033]" />
            </div>
            <div>
              <h3 className="font-space-mono font-black text-sm sm:text-base text-[#F5D033] uppercase tracking-wider flex items-center gap-2">
                HACKER HOUSE GOA 2026 HYPE REEL
              </h3>
              <p className="text-[11px] text-white/70">Official Studio Promo & Video Showcase</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 bg-red-600/80 hover:bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-all cursor-pointer font-bold border border-white/30"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Display Area */}
        <div className="aspect-video w-full bg-black relative flex items-center justify-center overflow-hidden">
          {hasError ? (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md bg-[#042416] border border-white/20 rounded-2xl mx-4 my-auto">
              <div className="p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-full">
                <Play className="w-8 h-8 text-[#F5D033]" />
              </div>
              <div>
                <h4 className="text-white font-bold text-base uppercase tracking-wider mb-1">
                  Video File Not Found ({videoSource})
                </h4>
                <p className="text-white/70 text-xs">
                  Upload your <code className="bg-black/50 px-1.5 py-0.5 rounded text-[#F5D033]">hhgoa.mp4</code> video file or paste a YouTube / video link below.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-2">
                <label className="flex-1 px-4 py-2.5 bg-[#F5D033] hover:bg-[#ffe252] text-[#045E38] font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Upload Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={loadDemoYoutube}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer border border-white/20 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#F5D033]" />
                  <span>Play Demo Reel</span>
                </button>
              </div>
            </div>
          ) : isYoutube ? (
            <iframe
              className="w-full h-full"
              src={videoSource}
              title="Hacker House Goa Teaser Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={videoSource}
              controls
              autoPlay
              loop
              playsInline
              onError={handleVideoError}
              className="w-full h-full object-contain bg-black"
            >
              Your browser does not support HTML5 video element.
            </video>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-black/80 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60 px-5">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            GOA HACKER HOUSE 2026 // LIVE HYPE
          </span>
        </div>

      </div>
    </div>
  );
};
