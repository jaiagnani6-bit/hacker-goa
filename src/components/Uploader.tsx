import React, { useRef, useState, useEffect } from 'react';
import { Upload, Camera, Image as ImageIcon, AlertCircle, Loader2, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { convertHeicToJpeg, isHeicFile } from '../lib/heicConvert';
import { UploadedImage } from '../types';

interface UploaderProps {
  onImageSelected: (image: UploadedImage) => void;
  isProcessing?: boolean;
}


export const Uploader: React.FC<UploaderProps> = ({ onImageSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live Camera Selfie Modal state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraLoading, setCameraLoading] = useState(false);

  // Stop camera tracks helper
  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  };

  // Start Webcam stream
  const startCamera = async (mode: 'user' | 'environment' = 'user') => {
    setErrorMessage(null);
    setCameraLoading(true);
    setIsCameraActive(true);

    try {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1080 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setMediaStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraLoading(false);
    } catch (err: any) {
      console.warn('getUserMedia failed, falling back to camera file input', err);
      stopCamera();
      // Fallback to native mobile/browser camera picker
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        setErrorMessage('Camera access was denied or is not supported on this browser.');
      }
    }
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [isCameraActive, mediaStream]);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mediaStream]);

  // Take Snapshot from video element
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement('canvas');
    const size = Math.min(video.videoWidth || 800, video.videoHeight || 800);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Center crop square
    const startX = ((video.videoWidth || size) - size) / 2;
    const startY = ((video.videoHeight || size) - size) / 2;

    // Flip horizontally if front camera for natural selfie orientation
    if (facingMode === 'user') {
      ctx.translate(size, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    stopCamera();

    onImageSelected({
      file: null,
      dataUrl,
      width: size,
      height: size,
      name: `Selfie_${Date.now()}.jpg`,
    });
  };

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    try {
      let processedFile: File | Blob = file;

      // Detect & convert HEIC from iOS/iPhone
      if (isHeicFile(file)) {
        setLoadingMsg('Converting HEIC image from iPhone...');
        processedFile = await convertHeicToJpeg(file);
      } else {
        setLoadingMsg('Decoding photo...');
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setLoadingMsg(null);
          onImageSelected({
            file: file,
            dataUrl,
            width: img.width,
            height: img.height,
            name: file.name,
          });
        };
        img.onerror = () => {
          setLoadingMsg(null);
          setErrorMessage('Could not load image file. Please choose a valid JPG or PNG.');
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(processedFile);
    } catch (err: any) {
      setLoadingMsg(null);
      setErrorMessage(err.message || 'Error processing uploaded file');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };


  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Live Camera Modal */}
      {isCameraActive && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#093326] border border-white/20 rounded-3xl p-6 max-w-md w-full text-center space-y-4 relative shadow-2xl overflow-hidden">
            <button
              type="button"
              onClick={stopCamera}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
                <Camera className="w-5 h-5 text-yellow-400" />
                <span>Take Goa Selfie</span>
              </h3>
              <p className="text-xs text-emerald-200/80">
                Center your face in the circle & snap your photo!
              </p>
            </div>

            {/* Video Preview Container */}
            <div className="relative aspect-square w-full rounded-2xl bg-black overflow-hidden border-2 border-yellow-400/40 shadow-inner flex items-center justify-center">
              {cameraLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10 text-yellow-300 gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">Opening Camera...</span>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Oval Face Guide Overlay */}
              <div className="absolute inset-0 border-[3px] border-yellow-400/40 rounded-full scale-90 pointer-events-none border-dashed animate-pulse" />
            </div>

            {/* Camera Controls */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  const newMode = facingMode === 'user' ? 'environment' : 'user';
                  setFacingMode(newMode);
                  startCamera(newMode);
                }}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 transition-all"
                title="Switch Camera"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={captureSnapshot}
                disabled={cameraLoading}
                className="px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-[#0B3D2E] font-black text-sm uppercase tracking-widest rounded-2xl shadow-[0_10px_30px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Snap Selfie</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Upload Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer backdrop-blur-xl ${
          isDragging
            ? 'border-yellow-400 bg-yellow-400/10 scale-[1.01]'
            : 'border-white/20 hover:border-yellow-400 bg-white/5 hover:bg-white/10'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileChange}
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          className="hidden"
        />
        <input
          type="file"
          ref={cameraInputRef}
          onChange={onFileChange}
          accept="image/*"
          capture="user"
          className="hidden"
        />

        {loadingMsg ? (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
            <p className="text-yellow-200 font-medium text-base">{loadingMsg}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 shadow-lg shadow-yellow-500/10 group-hover:scale-110 transition-transform">
              <Upload className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white tracking-wide uppercase">
                Upload Your Photo
              </h3>
              <p className="text-emerald-200/80 text-xs sm:text-sm mt-1 max-w-xs mx-auto">
                Drag & drop or tap to select from gallery. Supports JPG, PNG, & iPhone HEIC.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-6 py-3 bg-yellow-400 text-[#0B3D2E] font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(250,204,21,0.3)] flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                Choose Photo
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startCamera('user');
                }}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs uppercase tracking-widest rounded-2xl backdrop-blur-md transition-all flex items-center gap-2 hover:scale-[1.02]"
              >
                <Camera className="w-4 h-4 text-yellow-400" />
                Take Selfie
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 text-red-200 text-sm backdrop-blur-md">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Upload Issue</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

    </div>
  );
};
