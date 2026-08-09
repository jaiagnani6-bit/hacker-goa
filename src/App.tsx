import React, { useState, useEffect } from 'react';
import { Upload, Eye, Home, Film, ShieldCheck } from 'lucide-react';
import { Uploader } from './components/Uploader';
import { FramePreview } from './components/FramePreview';
import { DownloadButton } from './components/DownloadButton';
import { CinematicIntro } from './components/CinematicIntro';
import { VerifyModal } from './components/VerifyModal';
import { PassesDatabaseModal } from './components/PassesDatabaseModal';
import { HypeModal } from './components/HypeModal';
import { FrameStyle, RoleBadge, UploadedImage, GeneratorMode, IdCardDetails } from './types';
import { savePassToDatabase } from './lib/firebase';
import pfpGenBgUrl from './assets/images/pfp_gen_bg_1786130918771.jpg';
import goaBgUrl from './assets/images/goa_hacker_house_bg_1786130749646.jpg';
import tropicalBgUrl from './assets/images/tropical_beach_hero_bg.jpg';
import bannerBgUrl from './assets/images/hacker_house_banner_bg_1786130906845.jpg';

type ViewMode = 'home' | 'generator' | 'loading';
type GeneratorTab = 'upload' | 'share';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState<ViewMode>('home');
  const [showHypeModal, setShowHypeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<GeneratorTab>('upload');

  // Database Modals state
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isPassesDbOpen, setIsPassesDbOpen] = useState(false);
  const [verifyPassCode, setVerifyPassCode] = useState('');
  const [savedPassCode, setSavedPassCode] = useState<string | null>(null);
  const [isSavingPass, setIsSavingPass] = useState(false);

  // Generator form state
  const [generatorMode, setGeneratorMode] = useState<GeneratorMode>('id-card');
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null);
  const [fullName, setFullName] = useState('Satoshi Nakamoto');
  const [twitterHandle, setTwitterHandle] = useState('@satoshi');
  const [stackRole, setStackRole] = useState('Full-Stack / Rust / AI');
  const [customRoleText, setCustomRoleText] = useState('');
  const [currentCanvas, setCurrentCanvas] = useState<HTMLCanvasElement | null>(null);

  const [frameStyle, setFrameStyle] = useState<FrameStyle>('classic');
  const [roleBadge, setRoleBadge] = useState<RoleBadge>('BUILDER');

  const idCardDetails: IdCardDetails = {
    name: fullName,
    handle: twitterHandle,
    role: roleBadge,
    customRole: customRoleText,
    track: stackRole as any,
    idNumber: 'GOA-8F92A',
    motto: 'Goa Hacker House 2026',
    theme: frameStyle as any,
    showLanyard: true,
  };

  const handleOpenVerifyWithCode = (code: string) => {
    setVerifyPassCode(code);
    setIsVerifyOpen(true);
  };

  const handleSavePassToFirestore = async () => {
    setIsSavingPass(true);
    try {
      let imgDataUrl = selectedImage?.dataUrl;
      if (currentCanvas) {
        imgDataUrl = currentCanvas.toDataURL('image/jpeg', 0.85);
      }

      const saved = await savePassToDatabase({
        holderName: fullName,
        handle: fullName.toLowerCase().replace(/\s+/g, '_'),
        role: roleBadge,
        track: stackRole,
        motto: 'Goa Hacker House 2026',
        theme: frameStyle,
        imageUrl: imgDataUrl || '',
        createdBy: 'guest-user',
        creatorEmail: 'guest@hackerhouse.goa',
        creatorPhoto: '',
        verified: true,
      });

      setSavedPassCode(saved.passCode);
      alert(`Pass registered in Database!\nVerification Code: ${saved.passCode}`);
    } catch (err: any) {
      console.error('Failed to save pass:', err);
      alert('Error saving pass to database: ' + (err.message || 'Please check auth state'));
    } finally {
      setIsSavingPass(false);
    }
  };

  const handleGoToGenerator = () => {
    setView('generator');
    setActiveTab('upload');
    setSelectedImage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoHome = () => {
    setView('loading');
    setTimeout(() => {
      setView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1200);
  };

  const handleImageSelected = (img: UploadedImage) => {
    setSelectedImage(img);
    setActiveTab('upload');
  };

  const handleStartOver = () => {
    setSelectedImage(null);
    setCurrentCanvas(null);
    setActiveTab('upload');
  };

  const handleSelectUploadTab = () => {
    setActiveTab('upload');
    setSelectedImage(null);
  };

  const handleSelectShareTab = () => {
    setActiveTab('share');
  };

  // 0. Cinematic Intro View
  if (showIntro) {
    return <CinematicIntro onComplete={() => setShowIntro(false)} />;
  }

  // 1. Loading Screen View
  if (view === 'loading') {
    return (
      <div className="w-full min-h-screen bg-[#045E38] text-white flex flex-col items-center justify-center space-y-6 font-space-mono p-4">
        <div className="bg-[#FFE600] text-[#0A6B37] font-pixel font-black px-4 py-1.5 rounded text-sm tracking-widest uppercase shadow-lg border border-black/20">
          2:47 PM STUDIO
        </div>
        <div className="w-12 h-12 border-4 border-[#F5D033] border-t-transparent rounded-full animate-spin" />
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-[#F5D033] tracking-wider uppercase">
            HH GOA 2026 STUDIO
          </h2>
          <p className="text-white/70 text-xs">
            Initializing Shader Background & Brand Assets...
          </p>
        </div>
      </div>
    );
  }

  // 2. Home Hero Landing View
  if (view === 'home') {
    return (
      <div className="w-full min-h-screen bg-[#045E38] text-white flex flex-col justify-between font-sans selection:bg-[#F5D033] selection:text-[#045E38] relative overflow-x-hidden">
        {/* Top Navigation Bar */}
        <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="bg-[#FFE600] text-[#0A6B37] font-pixel font-bold text-sm sm:text-base px-3.5 py-1.5 rounded border border-black/30 shadow-md tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#0A6B37] rounded-full animate-pulse" />
              2:47 PM STUDIO
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 font-space-mono flex-wrap justify-end">
            <button
              type="button"
              onClick={() => setShowHypeModal(true)}
              className="px-3.5 py-2 bg-black/40 hover:bg-black/60 border border-white/20 rounded-lg text-xs sm:text-sm font-bold text-white transition-all flex items-center gap-1.5 backdrop-blur-md cursor-pointer uppercase tracking-wider"
            >
              <Eye className="w-4 h-4 text-[#F5D033]" />
              CHECK HYPE
            </button>

            <button
              type="button"
              onClick={handleGoToGenerator}
              className="px-4 py-2 bg-[#FFE600] hover:bg-[#ffe252] text-[#045E38] font-black rounded-lg text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all flex items-center gap-1.5 cursor-pointer apply-button-pattern active:scale-95 border border-[#FFE600]"
            >
              <span>APPLY</span>
            </button>
          </div>
        </header>

        {/* Main Hero Poster Section */}
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 my-auto py-4 z-10 flex flex-col items-center">
          <div className="w-full bg-[#0A6B37] bg-grain border-4 border-[#FFE600]/50 rounded-3xl p-6 sm:p-10 relative shadow-2xl overflow-hidden flex flex-col items-center justify-between min-h-[580px] sm:min-h-[640px]">
            {/* Tropical Beach Illustration Background with Dark Green Translucent Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              <img
                src={tropicalBgUrl}
                alt="Tropical Beach Illustration Background"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center scale-105"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
              <div
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(6, 45, 25, 0.85)', mixBlendMode: 'multiply' }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0A6B37]/50 via-transparent to-[#0A6B37]/60 pointer-events-none" />
            </div>

            {/* Background Ambient Lighting */}
            <div className="absolute inset-0 hero-ambient-glow pointer-events-none z-0" />

            {/* Top Poster Meta Header */}
            <div className="w-full flex items-center justify-between z-10 font-pixel text-xs sm:text-sm text-[#FFE600] pb-2 border-b border-white/10">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FFE600] animate-ping" />
                2:47 PM STUDIO
              </span>
              <span className="font-space-mono text-white/80">GOA 2026</span>
            </div>

            {/* Giant Graphic Typography */}
            <div className="relative z-10 text-center my-auto flex items-center justify-center select-none w-full py-4 px-2 min-h-[251px]">
              <div className="relative inline-flex items-center justify-center w-full max-w-[1162px]">
                {/* HACKER and HOUSE stacked tightly — identical to original spacing */}
                <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-[9rem] xl:text-[10.5rem] font-jakarta font-extrabold tracking-tight text-[#FFE600] uppercase leading-none text-center mx-auto w-full drop-shadow-md">
                  <span className="block">HACKER</span>
                  <span className="block">HOUSE</span>
                </h1>
                {/* गोवा sticker — absolutely floats over the gap, zero layout impact */}
                <span className="hindi-goa" aria-hidden="true">गोवा</span>
              </div>
            </div>

            {/* Poster Metadata Line */}
            <div className="relative z-10 w-full flex flex-col sm:flex-row items-center justify-between gap-3 font-space-mono text-xs sm:text-sm text-white font-bold py-3 border-t border-white/20">
              <div className="flex items-center gap-2 tracking-wider">
                <span>GOA, INDIA</span>
                <span className="text-[#FFE600]">•</span>
                <span>28 - 31 OCT 2026</span>
              </div>
              <button
                type="button"
                onClick={handleGoToGenerator}
                className="px-5 py-2 bg-[#FFE600] hover:bg-[#ffe252] text-[#045E38] font-black rounded-lg text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>CREATE PASS // APPLY</span>
              </button>
              <div className="font-pixel text-[#FFE600] tracking-widest hidden sm:block">
                2:47 PM STUDIO
              </div>
            </div>
          </div>
        </main>

        {/* Marquee Ticker Footer */}
        <footer className="w-full bg-[#033E25] border-t border-white/10 py-3 overflow-hidden whitespace-nowrap font-space-mono text-xs text-[#F5D033]/90 z-20">
          <div className="inline-block animate-marquee tracking-wider font-bold">
            <span className="mx-6">#FrameInGoa</span> • <span className="mx-6">HH GOA 2026</span> • <span className="mx-6">October 28-31, 2026</span> • <span className="mx-6">Goa, India</span> • <span className="mx-6">Built for HH Goa 2026 Builders & attendees.</span> • 
            <span className="mx-6">#FrameInGoa</span> • <span className="mx-6">HH GOA 2026</span> • <span className="mx-6">October 28-31, 2026</span> • <span className="mx-6">Goa, India</span> • <span className="mx-6">Built for HH Goa 2026 Builders & attendees.</span>
          </div>
        </footer>

        {/* Hype Video Modal */}
        <HypeModal isOpen={showHypeModal} onClose={() => setShowHypeModal(false)} />
      </div>
    );
  }

  // 3. Generator Social Card View
  // 3. Generator Social Card View
  return (
    <div className="w-full min-h-screen bg-[#045E38] text-white flex flex-col font-sans selection:bg-[#F5D033] selection:text-[#045E38] relative overflow-x-hidden overflow-y-auto">
      {/* Top Header Bar */}
      <header className="w-full bg-[#033E25]/90 border-b border-white/10 px-4 sm:px-8 py-4 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5D033] flex items-center justify-center text-[#045E38] font-black text-xl shadow-md border border-black/20">
            🌴
          </div>
          <div>
            <h2 className="font-space-mono font-black text-sm sm:text-base text-[#F5D033] uppercase tracking-wider">
              HACKER GOA HOUSE
            </h2>
            <p className="text-[10px] sm:text-xs text-white/70 font-space-mono">
              Builder Social Card Generator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 font-space-mono">
          <button
            type="button"
            onClick={handleGoHome}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-bold text-white transition-all flex items-center gap-1.5 backdrop-blur-md cursor-pointer uppercase tracking-wider"
          >
            <Home className="w-3.5 h-3.5 text-[#F5D033]" />
            HOME
          </button>

          <div className="hidden sm:flex items-center bg-[#FFE600] text-[#0A6B37] font-pixel font-bold text-xs px-3 py-1 rounded border border-black/20 uppercase tracking-wider">
            2:47 PM STUDIO
          </div>
        </div>
      </header>

      {/* Main Generator Workspace */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8 flex-1">
        {/* Title Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-black tracking-wider text-[#F5D033] uppercase font-space-mono">
            Hacker Goa House Builder Pass
          </h1>
          <p className="text-white/80 text-xs sm:text-sm font-space-mono">
            Personalize & generate your official builder pass for Hacker House Goa 2026
          </p>
        </div>



        {!selectedImage ? (
          /* Form Input Card */
          <div className="max-w-xl mx-auto bg-[#0B3D2E] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <label className="block text-xs font-space-mono font-bold text-[#F5D033] uppercase mb-2">
                Builder Photo
              </label>
              <Uploader onImageSelected={handleImageSelected} />
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10 font-space-mono">
              <div>
                <label className="block text-xs font-bold text-[#F5D033] uppercase mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Satoshi Nakamoto"
                  className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#F5D033] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#F5D033] uppercase mb-2">
                  Stack / Role
                </label>
                <input
                  type="text"
                  value={stackRole}
                  onChange={(e) => setStackRole(e.target.value)}
                  placeholder="e.g. Full-Stack / Rust / AI"
                  className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#F5D033] transition-all"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Customizer & Pass Preview Workspace */
          generatorMode === 'id-card' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-6 flex flex-col items-center">
                <FramePreview
                  image={selectedImage}
                  mode={generatorMode}
                  onModeChange={setGeneratorMode}
                  onCanvasRendered={setCurrentCanvas}
                  selectedFrame={frameStyle}
                  onFrameChange={setFrameStyle}
                  selectedBadge={roleBadge}
                  onBadgeChange={setRoleBadge}
                  idCardDetails={idCardDetails}
                />
              </div>

              <div className="lg:col-span-6 space-y-6 bg-[#0B3D2E] border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <span className="font-space-mono font-bold text-xs text-[#F5D033] uppercase">
                    Customize Pass
                  </span>
                  <button
                    type="button"
                    onClick={handleStartOver}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs font-space-mono font-bold text-white transition-all cursor-pointer"
                  >
                    New Photo
                  </button>
                </div>

                {/* 1. PARTICIPANT FULL NAME */}
                <div>
                  <label className="block text-xs font-bold text-[#F5D033] uppercase mb-1.5 font-space-mono tracking-wider">
                    Participant Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Satoshi Nakamoto"
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-[#F5D033]"
                  />
                </div>

                {/* 2. X / TWITTER HANDLE */}
                <div>
                  <label className="block text-xs font-bold text-[#F5D033] uppercase mb-1.5 font-space-mono tracking-wider">
                    X / Twitter Handle
                  </label>
                  <input
                    type="text"
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value)}
                    placeholder="@satoshi"
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-[#F5D033]"
                  />
                </div>

                {/* 3. STACK / ROLE */}
                <div>
                  <label className="block text-xs font-bold text-[#F5D033] uppercase mb-1.5 font-space-mono tracking-wider">
                    Stack / Role
                  </label>
                  <input
                    type="text"
                    value={stackRole}
                    onChange={(e) => setStackRole(e.target.value)}
                    placeholder="e.g. Full-Stack / Rust / AI"
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#F5D033]"
                  />
                </div>

                {/* 4. FRAME STYLE / THEME */}
                <div>
                  <label className="block text-xs font-space-mono font-bold text-[#F5D033] uppercase mb-2 tracking-wider">
                    Frame Style / Theme
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'classic', label: 'Emerald' },
                      { id: 'cyber', label: 'Cyber' },
                      { id: 'sunset', label: 'Sunset' },
                      { id: 'holo', label: 'Holo' },
                      { id: 'minimal', label: 'Minimal' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setFrameStyle(st.id as FrameStyle)}
                        className={`py-2 px-3 rounded-lg text-xs font-space-mono font-bold uppercase border transition-all cursor-pointer text-center ${
                          frameStyle === st.id
                            ? 'bg-[#F5D033] text-[#045E38] border-[#F5D033] font-black shadow-md scale-105'
                            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. ROLE BADGE (Do NOT wrap the role badges in outer boxes or extra borders) */}
                <div>
                  <label className="block text-xs font-space-mono font-bold text-[#F5D033] uppercase mb-2 tracking-wider">
                    Role Badge
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['BUILDER', 'HACKER', 'FOUNDER', 'DESIGNER', 'SPEAKER', 'ATTENDEE', 'MENTOR', 'ORGANIZER'] as RoleBadge[]).map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setRoleBadge(bg)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-space-mono font-bold uppercase transition-all cursor-pointer ${
                          roleBadge === bg && !customRoleText.trim()
                            ? 'bg-[#F5D033] text-[#045E38] font-black shadow-md scale-105'
                            : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 6. CUSTOM ROLE / BADGE TEXT */}
                <div>
                  <label className="block text-xs font-bold text-[#F5D033] uppercase mb-1.5 font-space-mono tracking-wider">
                    Custom Role / Badge Text
                  </label>
                  <input
                    type="text"
                    value={customRoleText}
                    onChange={(e) => setCustomRoleText(e.target.value)}
                    placeholder="e.g. AI ARCHITECT / CORE DEV"
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F5D033] transition-all font-space-mono font-bold"
                  />
                </div>

                {/* 7. Action buttons */}
                <div className="pt-4 border-t border-white/10 flex flex-col gap-3 font-space-mono">
                  <DownloadButton canvas={currentCanvas} />
                </div>
              </div>
            </div>
          ) : (
            /* PFP Mode: Render FramePreview in full width without right-side Customize Pass panel */
            <div className="w-full">
              <FramePreview
                image={selectedImage}
                mode={generatorMode}
                onModeChange={setGeneratorMode}
                onCanvasRendered={setCurrentCanvas}
                selectedFrame={frameStyle}
                onFrameChange={setFrameStyle}
                selectedBadge={roleBadge}
                onBadgeChange={setRoleBadge}
                idCardDetails={idCardDetails}
              />
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/10 py-6 text-center text-xs font-space-mono text-white/60 bg-[#033E25]">
        Hacker Goa House 2026 • Built in Goa, Ship from Paradise
      </footer>

      {/* Modals */}
      <HypeModal
        isOpen={showHypeModal}
        onClose={() => setShowHypeModal(false)}
      />

      <VerifyModal
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        initialCode={verifyPassCode}
      />

      <PassesDatabaseModal
        isOpen={isPassesDbOpen}
        onClose={() => setIsPassesDbOpen(false)}
        onSelectPassToVerify={(code) => {
          setVerifyPassCode(code);
          setIsVerifyOpen(true);
        }}
      />
    </div>
  );
}


