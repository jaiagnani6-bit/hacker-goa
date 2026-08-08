export type FrameStyle = 'classic' | 'badge' | 'cyber' | 'minimal' | 'poster';

export type RoleBadge = 'BUILDER' | 'HACKER' | 'SPEAKER' | 'ATTENDEE' | 'GOA 2026' | 'FOUNDER' | 'DESIGNER' | 'MENTOR' | 'ORGANIZER' | 'NONE';

export type IdCardTheme = 'emerald' | 'sunset' | 'holo' | 'cyber';

export type IdCardTrack = 'AI & Agents' | 'Web3 & Infra' | 'Fullstack & Mobile' | 'DeFi & Payments' | 'Hardware & IoT';

export type GeneratorMode = 'id-card' | 'pfp';

export interface IdCardDetails {
  name: string;
  handle: string;
  role: RoleBadge;
  customRole?: string;
  track: IdCardTrack;
  idNumber: string;
  motto: string;
  theme: IdCardTheme;
  showLanyard: boolean;
}

export interface TransformState {
  x: number;
  y: number;
  scale: number;
  rotate: number; // in degrees
  flipX: boolean;
}

export interface UploadedImage {
  file: File | null;
  dataUrl: string;
  width: number;
  height: number;
  name: string;
}

export interface FrameOption {
  id: FrameStyle;
  name: string;
  description: string;
  shape: 'circle' | 'squircle' | 'full';
}

export interface ShareResponse {
  success: boolean;
  id: string;
  shareUrl: string;
  imageUrl: string;
  error?: string;
}

