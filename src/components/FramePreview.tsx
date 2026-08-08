import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  Sliders,
  CheckCircle2,
  Wand2,
  IdCard,
  Image as ImageIconLucide,
} from 'lucide-react';
import { compositePFPImage, compositeIDCardImage } from '../lib/compositing';
import {
  FrameOption,
  FrameStyle,
  GeneratorMode,
  IdCardDetails,
  RoleBadge,
  TransformState,
  UploadedImage,
} from '../types';

interface FramePreviewProps {
  image: UploadedImage;
  mode: GeneratorMode;
  onModeChange: (mode: GeneratorMode) => void;
  onCanvasRendered: (canvas: HTMLCanvasElement) => void;
  selectedFrame: FrameStyle;
  onFrameChange: (frame: FrameStyle) => void;
  selectedBadge: RoleBadge;
  onBadgeChange: (badge: RoleBadge) => void;
  idCardDetails: IdCardDetails;
}

const FRAME_OPTIONS: FrameOption[] = [
  {
    id: 'classic',
    name: 'Goa Sunburst',
    description: 'Circular cutout with radiant yellow rays & palm trees',
    shape: 'circle',
  },
  {
    id: 'badge',
    name: 'Builder Badge',
    description: 'Squircle badge frame with golden leaf accents',
    shape: 'squircle',
  },
  {
    id: 'cyber',
    name: 'Beach Sunset Overlay',
    description: 'Full image backdrop with wave graphics & bottom overlay',
    shape: 'full',
  },
  {
    id: 'minimal',
    name: 'Sunset Ring',
    description: 'Clean circular frame with gold ring & palm leaves',
    shape: 'circle',
  },
  {
    id: 'poster',
    name: 'Graphic Poster',
    description: 'Top & bottom event banner overlay',
    shape: 'squircle',
  },
];

const BADGE_OPTIONS: RoleBadge[] = [
  'BUILDER',
  'HACKER',
  'FOUNDER',
  'DESIGNER',
  'SPEAKER',
  'ATTENDEE',
  'MENTOR',
  'ORGANIZER',
];

export const FramePreview: React.FC<FramePreviewProps> = ({
  image,
  mode,
  onModeChange,
  onCanvasRendered,
  selectedFrame,
  onFrameChange,
  selectedBadge,
  onBadgeChange,
  idCardDetails,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform state for user photo adjustments
  const [transform, setTransform] = useState<TransformState>({
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    flipX: false,
  });

  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Pointer drag state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; initialX: number; initialY: number }>({
    x: 0,
    y: 0,
    initialX: 0,
    initialY: 0,
  });

  // Load HTMLImageElement
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
    };
    img.src = image.dataUrl;
  }, [image.dataUrl]);

  // Auto-center and reset photo position when image, mode or frame changes
  useEffect(() => {
    setTransform({
      x: 0,
      y: 0,
      scale: 1,
      rotate: 0,
      flipX: false,
    });
  }, [image.dataUrl, mode, selectedFrame]);

  // Re-render canvas whenever relevant states change
  const renderCanvas = useCallback(async () => {
    if (!imageObj || !canvasRef.current) return;
    setIsRendering(true);

    try {
      let renderedCanvas: HTMLCanvasElement;
      if (mode === 'id-card') {
        renderedCanvas = await compositeIDCardImage(
          imageObj,
          transform,
          idCardDetails,
          canvasRef.current
        );
      } else {
        renderedCanvas = await compositePFPImage(
          imageObj,
          transform,
          selectedFrame,
          selectedBadge,
          canvasRef.current
        );
      }
      onCanvasRendered(renderedCanvas);
    } catch (err) {
      console.error('Canvas render failed:', err);
    } finally {
      setIsRendering(false);
    }
  }, [imageObj, transform, mode, idCardDetails, selectedFrame, selectedBadge, onCanvasRendered]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle Drag / Pointer Events
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: transform.x,
      initialY: transform.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const previewWidth = containerRef.current?.clientWidth || 360;
    const factor = (mode === 'id-card' ? 1000 : 1200) / previewWidth;

    setTransform((prev) => ({
      ...prev,
      x: dragStartRef.current.initialX + dx * factor,
      y: dragStartRef.current.initialY + dy * factor,
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Quick reset & adjustment controls
  const handleReset = () => {
    setTransform({
      x: 0,
      y: 0,
      scale: 1,
      rotate: 0,
      flipX: false,
    });
  };

  const handleRotate90 = () => {
    setTransform((prev) => ({
      ...prev,
      rotate: (prev.rotate + 90) % 360,
    }));
  };

  const handleFlip = () => {
    setTransform((prev) => ({
      ...prev,
      flipX: !prev.flipX,
    }));
  };

  const renderCanvasSlot = () => (
    <div
      className={`w-full max-w-[420px] relative group rounded-3xl border-4 border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden bg-[#06241c] ring-1 ring-yellow-400/30 transition-all ${
        mode === 'id-card' ? 'aspect-[10/14]' : 'aspect-square'
      }`}
    >
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none relative"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain block pointer-events-none"
        />

        {/* Reposition instruction overlay hint */}
        <div className="absolute top-3 left-3 right-3 pointer-events-none flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity z-10">
          <span className="bg-black/80 backdrop-blur-md border border-white/20 text-yellow-300 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow">
            ✨ Drag photo to adjust
          </span>
          {isRendering && (
            <span className="bg-yellow-400 text-[#0B3D2E] text-[10px] uppercase font-black px-2.5 py-1 rounded-full shadow animate-pulse">
              Rendering...
            </span>
          )}
        </div>
      </div>

      {/* Canvas Quick Actions Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-center gap-1.5 bg-black/85 backdrop-blur-md border border-white/20 p-2 rounded-2xl shadow-2xl z-20">
        <button
          type="button"
          onClick={handleReset}
          title="Auto-Fit Photo"
          className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-[#0B3D2E] rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-md"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Fit
        </button>

        <button
          type="button"
          onClick={handleReset}
          title="Reset Position"
          className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-yellow-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>

        <button
          type="button"
          onClick={handleRotate90}
          title="Rotate 90°"
          className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-yellow-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Rotate
        </button>

        <button
          type="button"
          onClick={handleFlip}
          title="Flip Horizontally"
          className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-yellow-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
        >
          <FlipHorizontal className="w-3.5 h-3.5" />
          Flip
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Top Generator Mode Switcher Pills */}
      <div className="flex justify-center">
        <div className="inline-flex bg-white/5 border border-white/10 rounded-2xl p-1.5 backdrop-blur-xl shadow-xl">
          <button
            type="button"
            onClick={() => onModeChange('id-card')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              mode === 'id-card'
                ? 'bg-yellow-400 text-[#0B3D2E] shadow-lg shadow-yellow-400/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <IdCard className="w-4 h-4" />
            <span>Official ID Pass Card</span>
            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-bold ml-1">
              Pass
            </span>
          </button>

          <button
            type="button"
            onClick={() => onModeChange('pfp')}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              mode === 'pfp'
                ? 'bg-yellow-400 text-[#0B3D2E] shadow-lg shadow-yellow-400/20'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <ImageIconLucide className="w-4 h-4" />
            <span>Profile Picture Frame</span>
            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-bold ml-1">
              PFP
            </span>
          </button>
        </div>
      </div>

      {mode === 'id-card' ? (
        /* ID CARD PASS TAB VIEW: ONLY Canvas on left. ID CARD DETAILS middle box is REMOVED! */
        <div className="flex justify-center w-full">
          {renderCanvasSlot()}
        </div>
      ) : (
        /* PFP FRAME TAB VIEW: 2-Column Grid with Left Canvas & Right PFP FRAME COMPOSITION Panel */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 flex flex-col items-center">
            {renderCanvasSlot()}
          </div>

          <div className="lg:col-span-6 space-y-6 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-yellow-400 font-bold text-sm uppercase tracking-widest">
                <Sliders className="w-4 h-4 text-yellow-400" />
                PFP Frame Composition
              </div>
            </div>

            {/* Photo Zoom Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-emerald-100">
                <span className="text-yellow-300 uppercase tracking-wider text-[11px]">
                  Photo Zoom
                </span>
                <span>{Math.round(transform.scale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.02"
                value={transform.scale}
                onChange={(e) =>
                  setTransform((prev) => ({ ...prev, scale: parseFloat(e.target.value) }))
                }
                className="w-full accent-yellow-400 bg-white/10 rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* Photo Rotation Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-emerald-100">
                <span className="text-yellow-300 uppercase tracking-wider text-[11px]">
                  Photo Rotation
                </span>
                <span>{transform.rotate}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={transform.rotate}
                onChange={(e) =>
                  setTransform((prev) => ({
                    ...prev,
                    rotate: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-yellow-400 bg-white/10 rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* Role Badge Tag Selector */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest block">
                Event Badge Tag Overlay
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BADGE_OPTIONS.map((badge) => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => onBadgeChange(badge)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      selectedBadge === badge
                        ? 'bg-yellow-400 text-[#0B3D2E] shadow-md shadow-yellow-400/20 font-black'
                        : 'bg-white/5 text-emerald-100 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {badge}
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Style Picker */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <label className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest block">
                PFP Frame Template
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FRAME_OPTIONS.map((frame) => {
                  const isSelected = selectedFrame === frame.id;
                  return (
                    <button
                      key={frame.id}
                      type="button"
                      onClick={() => onFrameChange(frame.id)}
                      className={`relative text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-yellow-400 bg-white/10 shadow-lg shadow-yellow-400/10'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400 absolute top-2 right-2" />
                      )}
                      <h4 className="font-black text-white text-xs uppercase tracking-wider">
                        {frame.name}
                      </h4>
                      <p className="text-[9px] text-emerald-200/80 leading-tight mt-1">
                        {frame.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
