import React, { useEffect, useState } from 'react';
import { SkipForward } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
  autoStart?: boolean;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [percentage, setPercentage] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const totalDuration = 2000; // 2 seconds total loading duration
    const startTime = performance.now();
    let animationFrameId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progressRatio = Math.min(1, elapsed / totalDuration);
      const currentPct = Math.floor(progressRatio * 100);
      setPercentage(currentPct);

      if (progressRatio < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setIsLoaded(true);
        setTimeout(() => {
          onComplete();
        }, 400);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete]);

  // Determine technical status text according to loading stage
  const getStatusText = (pct: number) => {
    if (pct < 25) return 'SYSTEM INITIALIZING';
    if (pct < 50) return 'INITIALIZING HH GOA 2026';
    if (pct < 75) return 'CREATIVE ENVIRONMENT LOADING';
    if (pct < 100) return 'SYSTEM READY';
    return 'HH GOA STUDIO // 2026';
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#045E38] text-white overflow-hidden select-none flex flex-col justify-between p-6 sm:p-12 font-sans transition-opacity duration-700 ${
        isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle Grain & Texture Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Thin Technical Grid Lines */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-15 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Corner Bracket Markers */}
      <div className="absolute top-6 left-6 w-5 h-5 border-t-2 border-l-2 border-white/40 pointer-events-none z-10" />
      <div className="absolute top-6 right-6 w-5 h-5 border-t-2 border-r-2 border-white/40 pointer-events-none z-10" />
      <div className="absolute bottom-6 left-6 w-5 h-5 border-b-2 border-l-2 border-white/40 pointer-events-none z-10" />
      <div className="absolute bottom-6 right-6 w-5 h-5 border-b-2 border-r-2 border-white/40 pointer-events-none z-10" />

      {/* Floating Subtle Micro Geometric Accents */}
      <div className="absolute top-1/4 left-12 flex flex-col space-y-2 text-[10px] font-mono text-emerald-100/60 pointer-events-none z-10 animate-pulse">
        <span>LOC // 15.2993° N</span>
        <span>LAT // 74.1240° E</span>
        <div className="w-8 h-[2px] bg-[#FF007F]" />
      </div>

      <div className="absolute bottom-1/3 right-12 flex items-center space-x-2 text-[10px] font-mono text-emerald-100/60 pointer-events-none z-10">
        <div className="w-2 h-2 bg-[#FFE600] animate-ping rounded-full" />
        <span>SYS.CONNECT // ACTIVE</span>
      </div>

      <div className="absolute top-1/3 right-16 w-3 h-3 border border-[#FF007F] rotate-45 pointer-events-none z-10 opacity-70 animate-bounce" />
      <div className="absolute bottom-1/4 left-20 w-2 h-2 bg-[#FFE600] pointer-events-none z-10 opacity-80" />

      {/* Top Bar: Studio Header & Skip Action */}
      <div className="relative z-20 flex items-center justify-between w-full">
        <div className="flex items-center space-x-2 bg-black/20 px-3.5 py-1.5 rounded-md border border-white/15 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#FFE600] animate-pulse" />
          <span className="text-xs font-mono tracking-widest text-[#FFE600] font-bold uppercase">
            HH GOA // 2026
          </span>
        </div>

        <button
          onClick={onComplete}
          type="button"
          className="flex items-center space-x-2 bg-black/30 hover:bg-[#FFE600] text-white hover:text-[#045E38] px-4 py-1.5 rounded-md border border-white/20 hover:border-[#FFE600] transition-all cursor-pointer font-mono font-bold text-xs tracking-widest uppercase backdrop-blur-md shadow-md"
        >
          <span>SKIP</span>
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Typography & Subheadings */}
      <div className="relative z-20 my-auto text-center flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-4">
        {/* Main Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-jakarta font-extrabold text-white uppercase tracking-tight leading-none mb-4 drop-shadow-md transition-all duration-500">
          HH GOA STUDIO
        </h1>

        {/* Subtitle with dynamic stage text */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-black/20 border border-white/10 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF007F]" />
          <span className="text-xs sm:text-sm font-mono tracking-widest text-emerald-100 font-bold uppercase">
            {getStatusText(percentage)}
          </span>
        </div>
      </div>

      {/* Lower-Center Loading System */}
      <div className="relative z-20 w-full max-w-md mx-auto flex flex-col items-center space-y-3 pb-4">
        {/* Animated Percentage Display */}
        <div className="flex items-baseline space-x-1 font-mono">
          <span className="text-3xl sm:text-4xl font-extrabold text-[#FFE600] tracking-tighter drop-shadow-sm">
            {String(percentage).padStart(2, '0')}
          </span>
          <span className="text-lg font-bold text-emerald-200/80">%</span>
        </div>

        {/* Thin Geometric Loading Bar */}
        <div className="w-full h-2 bg-black/30 rounded-full p-0.5 overflow-hidden border border-white/25 relative backdrop-blur-sm">
          <div
            className="h-full bg-gradient-to-r from-white via-[#FF007F] to-[#FFE600] rounded-full transition-all duration-100 ease-out relative"
            style={{ width: `${percentage}%` }}
          >
            {/* Leading Edge Accent */}
            {percentage > 0 && (
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#FFE600] rounded-r-full shadow-[0_0_8px_#FFE600]" />
            )}
          </div>
        </div>

        {/* Technical Status Bar Footer */}
        <div className="flex items-center justify-between w-full text-[10px] font-mono tracking-widest text-emerald-100/70 pt-1 uppercase">
          <span>ESTABLISHING CONNECTION</span>
          <span className="text-[#FFE600]">60 FPS // RENDER</span>
        </div>
      </div>
    </div>
  );
};
