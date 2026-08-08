import { FrameStyle, RoleBadge, TransformState, IdCardDetails } from '../types';
import QRCode from 'qrcode';

export const CANVAS_SIZE = 1200;

/**
 * Composites the uploaded photo and selected HH Goa 2026 frame into a high-res 1200x1200px PNG canvas.
 */
export async function compositePFPImage(
  imageElement: HTMLImageElement,
  transform: TransformState,
  frameStyle: FrameStyle,
  roleBadge: RoleBadge,
  targetCanvas?: HTMLCanvasElement
): Promise<HTMLCanvasElement> {
  const canvas = targetCanvas || document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas 2D context');

  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Define photo slot parameters depending on frame style
  const slot = getPhotoSlotConfig(frameStyle);

  // 1. Draw Background / Base layer
  drawBackground(ctx, frameStyle);

  // 2. Draw Sunburst / Rays if applicable (under photo or around slot)
  if (frameStyle === 'classic' || frameStyle === 'minimal' || frameStyle === 'poster') {
    drawSunRays(ctx, slot.cx, slot.cy, frameStyle);
  }

  // 3. Draw User Photo into slot with clipping and user transformations
  ctx.save();
  // Clip to photo slot area
  clipSlotPath(ctx, slot);

  // Fill slot background (in case photo doesn't fill completely)
  ctx.fillStyle = '#051F17';
  ctx.fill();

  // Draw transformed user image inside clipped region
  drawTransformedImage(ctx, imageElement, slot, transform);
  ctx.restore();

  // 4. Draw Frame Border & Outer Overlay Artwork (Palm trees, waves, badges, text)
  drawFrameArtwork(ctx, frameStyle, slot, roleBadge);

  return canvas;
}

interface PhotoSlotConfig {
  cx: number;
  cy: number;
  width: number;
  height: number;
  radius: number; // For circle/squircle
  shape: 'circle' | 'squircle' | 'rect';
}

function getPhotoSlotConfig(style: FrameStyle): PhotoSlotConfig {
  switch (style) {
    case 'classic':
      return { cx: 600, cy: 530, width: 840, height: 840, radius: 420, shape: 'circle' };
    case 'badge':
      return { cx: 600, cy: 510, width: 800, height: 800, radius: 120, shape: 'squircle' };
    case 'minimal':
      return { cx: 600, cy: 540, width: 880, height: 880, radius: 440, shape: 'circle' };
    case 'poster':
      return { cx: 600, cy: 580, width: 780, height: 780, radius: 24, shape: 'squircle' };
    case 'cyber':
    default:
      return { cx: 600, cy: 600, width: 1200, height: 1200, radius: 0, shape: 'rect' };
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, style: FrameStyle) {
  if (style === 'cyber') {
    // Cyber frame has full photo backdrop, background is fallback
    ctx.fillStyle = '#07291F';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    return;
  }

  // Rich Deep Forest Green background with radial highlight
  const gradient = ctx.createRadialGradient(600, 500, 100, 600, 600, 800);
  gradient.addColorStop(0, '#0F523E');
  gradient.addColorStop(0.6, '#0B3D2E');
  gradient.addColorStop(1, '#052219');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

function drawSunRays(ctx: CanvasRenderingContext2D, cx: number, cy: number, style: FrameStyle) {
  ctx.save();
  const rayCount = 18;
  const rayLength = style === 'minimal' ? 560 : 700;

  for (let i = 0; i < rayCount; i++) {
    const angle = (i * 2 * Math.PI) / rayCount;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, rayLength, angle - 0.08, angle + 0.08);
    ctx.closePath();

    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 215, 0, 0.22)' : 'rgba(255, 232, 26, 0.1)';
    ctx.fill();
  }
  ctx.restore();
}

// Helper for cross-browser rounded rectangle drawing
function drawRoundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// Helper to safely set letter spacing on canvas context
function setCanvasLetterSpacing(ctx: CanvasRenderingContext2D, spacing: string) {
  try {
    if ('letterSpacing' in ctx) {
      (ctx as any).letterSpacing = spacing;
    }
  } catch {
    // Ignore if unsupported
  }
}

function clipSlotPath(ctx: CanvasRenderingContext2D, slot: PhotoSlotConfig) {
  if (slot.shape === 'circle') {
    ctx.beginPath();
    ctx.arc(slot.cx, slot.cy, slot.radius, 0, Math.PI * 2);
  } else if (slot.shape === 'squircle') {
    const x = slot.cx - slot.width / 2;
    const y = slot.cy - slot.height / 2;
    drawRoundRectPath(ctx, x, y, slot.width, slot.height, slot.radius);
  } else {
    ctx.beginPath();
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }
  ctx.clip();
}

function drawTransformedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  slot: PhotoSlotConfig,
  transform: TransformState
) {
  ctx.save();

  // Move origin to center of slot + user manual x/y offset
  ctx.translate(slot.cx + transform.x, slot.cy + transform.y);

  // Apply user rotation
  if (transform.rotate) {
    ctx.rotate((transform.rotate * Math.PI) / 180);
  }

  // Apply horizontal flip
  if (transform.flipX) {
    ctx.scale(-1, 1);
  }

  // Cover-fit calculation: calculate scale so shorter dimension fills slot
  const slotW = slot.width;
  const slotH = slot.height;
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;

  const baseScale = Math.max(slotW / imgW, slotH / imgH);
  const finalScale = baseScale * transform.scale;

  const drawW = imgW * finalScale;
  const drawH = imgH * finalScale;

  // Draw centered at origin
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

  ctx.restore();
}

function drawFrameArtwork(
  ctx: CanvasRenderingContext2D,
  style: FrameStyle,
  slot: PhotoSlotConfig,
  roleBadge: RoleBadge
) {
  ctx.save();

  if (style === 'classic') {
    // 1. Gold Sunburst Ring around Central Circle
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(slot.cx, slot.cy, slot.radius + 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#FFE81A';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(slot.cx, slot.cy, slot.radius + 18, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Palm tree silhouettes on sides
    drawPalmTree(ctx, 90, 880, 1.1, false);
    drawPalmTree(ctx, 1110, 880, 1.1, true);

    // 3. Header Top Tag
    drawHeaderTag(ctx, 'HACKER HOUSE GOA 2026', 600, 70);

    // 4. Bottom Main Branding Card
    drawBottomBrandingCard(ctx, roleBadge);

  } else if (style === 'badge') {
    // Squircle Gold & Green Frame
    const x = slot.cx - slot.width / 2;
    const y = slot.cy - slot.height / 2;

    // Glowing border around squircle
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.roundRect(x - 6, y - 6, slot.width + 12, slot.height + 12, slot.radius + 6);
    ctx.stroke();

    ctx.strokeStyle = '#051F17';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Palm leaf corner decorations
    drawPalmTree(ctx, 110, 940, 0.9, false);
    drawPalmTree(ctx, 1090, 940, 0.9, true);

    // Top Header Banner
    drawTopRibbon(ctx, 'HACKER HOUSE GOA 2026');

    // Bottom Badge Details
    drawBottomBadgeBanner(ctx, roleBadge);

  } else if (style === 'cyber') {
    // Full photo mode with beach wave bottom banner
    drawCyberBeachBottomOverlay(ctx, roleBadge);

    // Top subtle bar
    drawTopBar(ctx);

  } else if (style === 'minimal') {
    // Elegant Sunset Ring Frame
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(slot.cx, slot.cy, slot.radius + 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#0B3D2E';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Palm tree accents
    drawPalmTree(ctx, 120, 920, 0.85, false);
    drawPalmTree(ctx, 1080, 920, 0.85, true);

    // Top Tag
    drawHeaderTag(ctx, 'HH GOA 2026', 600, 60);

    // Bottom minimal text
    drawMinimalBottomText(ctx, roleBadge);

  } else if (style === 'poster') {
    // Top Banner
    ctx.fillStyle = '#082C21';
    ctx.fillRect(0, 0, CANVAS_SIZE, 190);

    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 186, CANVAS_SIZE, 8);

    // Bottom Banner
    ctx.fillStyle = '#082C21';
    ctx.fillRect(0, 970, CANVAS_SIZE, 230);

    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 970, CANVAS_SIZE, 8);

    // Draw Poster Typography
    drawPosterHeader(ctx);
    drawPosterFooter(ctx, roleBadge);

    // Palm tree accents on bottom
    drawPalmTree(ctx, 100, 1080, 0.75, false);
    drawPalmTree(ctx, 1100, 1080, 0.75, true);
  }

  // Draw 2:47 PM STUDIO credit tag
  ctx.fillStyle = 'rgba(255, 232, 26, 0.75)';
  ctx.font = '700 16px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('2:47 PM STUDIO • #FrameInGoa', CANVAS_SIZE - 28, CANVAS_SIZE - 24);

  ctx.restore();
}

function drawHeaderTag(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Badge background
  ctx.fillStyle = '#FFD700';
  drawRoundRectPath(ctx, x - 180, y - 22, 360, 44, 22);
  ctx.fill();

  ctx.fillStyle = '#0B3D2E';
  ctx.font = '800 19px system-ui, sans-serif';
  setCanvasLetterSpacing(ctx, '2px');
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

function drawTopRibbon(ctx: CanvasRenderingContext2D, text: string) {
  ctx.save();
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(0, 0, CANVAS_SIZE, 70);

  ctx.fillStyle = '#052219';
  ctx.fillRect(0, 66, CANVAS_SIZE, 6);

  ctx.fillStyle = '#0B3D2E';
  ctx.font = '900 28px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  setCanvasLetterSpacing(ctx, '3px');
  ctx.fillText(text, 600, 36);
  ctx.restore();
}

function drawTopBar(ctx: CanvasRenderingContext2D) {
  ctx.save();
  // Semi-transparent gradient bar at top
  const grad = ctx.createLinearGradient(0, 0, 0, 120);
  grad.addColorStop(0, 'rgba(5, 31, 23, 0.9)');
  grad.addColorStop(1, 'rgba(5, 31, 23, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_SIZE, 120);

  ctx.fillStyle = '#FFD700';
  ctx.font = '800 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HACKER HOUSE GOA 2026', 600, 45);
  ctx.restore();
}

function drawBottomBrandingCard(ctx: CanvasRenderingContext2D, roleBadge: RoleBadge) {
  ctx.save();
  const cardY = 920;
  const cardH = 250;

  // Backdrop card
  ctx.fillStyle = '#072E23';
  drawRoundRectPath(ctx, 100, cardY, 1000, cardH, 28);
  ctx.fill();

  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 6;
  ctx.stroke();

  // 1. "HACKER HOUSE" Yellow Serif Typography
  ctx.fillStyle = '#FFD700';
  ctx.font = '900 58px "Georgia", "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  setCanvasLetterSpacing(ctx, '6px');
  ctx.fillText('HACKER HOUSE', 600, cardY + 55);

  // 2. "GOA 2026 • गोवा" Sub-banner (Gold + Pink accent)
  ctx.save();
  ctx.font = 'bold 32px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Pink glow background
  ctx.fillStyle = '#FF007A';
  ctx.fillText('GOA 2026  •  गोवा', 600, cardY + 105);
  ctx.restore();

  // 3. Subtitle: GOA, INDIA • 29 - 31 OCT 2026
  ctx.fillStyle = '#E2E8F0';
  ctx.font = '700 20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  setCanvasLetterSpacing(ctx, '2px');
  ctx.fillText('GOA, INDIA   •   OCTOBER 29 - 31, 2026', 600, cardY + 150);

  // 4. Optional Role Badge Tag
  if (roleBadge !== 'NONE') {
    drawRoleBadgePill(ctx, roleBadge, 600, cardY + 198);
  }

  ctx.restore();
}

function drawBottomBadgeBanner(ctx: CanvasRenderingContext2D, roleBadge: RoleBadge) {
  ctx.save();
  const cardY = 930;

  ctx.fillStyle = '#082C21';
  drawRoundRectPath(ctx, 140, cardY, 920, 230, 24);
  ctx.fill();

  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 5;
  ctx.stroke();

  // Title
  ctx.fillStyle = '#FFD700';
  ctx.font = '900 54px "Georgia", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  setCanvasLetterSpacing(ctx, '4px');
  ctx.fillText('HACKER HOUSE', 600, cardY + 52);

  // Goa text
  ctx.fillStyle = '#FF007A';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('GOA 2026  •  गोवा', 600, cardY + 100);

  // Date
  ctx.fillStyle = '#E2E8F0';
  ctx.font = '700 20px monospace';
  ctx.fillText('OCT 29 - 31, 2026  •  GOA, INDIA', 600, cardY + 142);

  if (roleBadge !== 'NONE') {
    drawRoleBadgePill(ctx, roleBadge, 600, cardY + 186);
  }

  ctx.restore();
}

function drawCyberBeachBottomOverlay(ctx: CanvasRenderingContext2D, roleBadge: RoleBadge) {
  ctx.save();
  const y = 880;

  // Dark gradient bottom overlay
  const grad = ctx.createLinearGradient(0, y - 80, 0, CANVAS_SIZE);
  grad.addColorStop(0, 'rgba(7, 41, 31, 0)');
  grad.addColorStop(0.3, 'rgba(7, 41, 31, 0.88)');
  grad.addColorStop(1, 'rgba(5, 31, 23, 0.98)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, y - 80, CANVAS_SIZE, CANVAS_SIZE - y + 80);

  // Waves line graphic
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, y);
  for (let x = 0; x <= CANVAS_SIZE; x += 40) {
    ctx.quadraticCurveTo(x + 20, y - 15, x + 40, y);
  }
  ctx.stroke();

  // Palm trees
  drawPalmTree(ctx, 80, y + 60, 0.8, false);
  drawPalmTree(ctx, 1120, y + 60, 0.8, true);

  // Text
  ctx.fillStyle = '#FFD700';
  ctx.font = '900 58px "Georgia", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HACKER HOUSE', 600, y + 65);

  ctx.fillStyle = '#FF2A85';
  ctx.font = 'bold 32px system-ui, sans-serif';
  ctx.fillText('GOA 2026  •  गोवा', 600, y + 112);

  ctx.fillStyle = '#FFF';
  ctx.font = '700 20px monospace';
  ctx.fillText('GOA, INDIA  •  29 - 31 OCT 2026', 600, y + 155);

  if (roleBadge !== 'NONE') {
    drawRoleBadgePill(ctx, roleBadge, 600, y + 198);
  }

  ctx.restore();
}

function drawMinimalBottomText(ctx: CanvasRenderingContext2D, roleBadge: RoleBadge) {
  ctx.save();
  const y = 990;

  ctx.fillStyle = '#FFD700';
  ctx.font = '900 48px "Georgia", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  setCanvasLetterSpacing(ctx, '4px');
  ctx.fillText('HACKER HOUSE', 600, y - 10);

  ctx.fillStyle = '#FF007A';
  ctx.font = 'bold 28px system-ui';
  ctx.fillText('GOA 2026  •  गोवा', 600, y + 32);

  ctx.fillStyle = '#FFE81A';
  ctx.font = '700 18px monospace';
  ctx.fillText('GOA, INDIA  •  29-31 OCT 2026', 600, y + 70);

  if (roleBadge !== 'NONE') {
    drawRoleBadgePill(ctx, roleBadge, 600, y + 112);
  }

  ctx.restore();
}

function drawPosterHeader(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = '#FFD700';
  ctx.font = '900 46px "Georgia", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HACKER HOUSE', 600, 55);

  ctx.fillStyle = '#FF007A';
  ctx.font = 'bold 26px system-ui';
  ctx.fillText('GOA 2026  •  गोवा', 600, 100);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 18px monospace';
  ctx.fillText('29 - 31 OCT 2026  •  GOA, INDIA', 600, 142);
  ctx.restore();
}

function drawPosterFooter(ctx: CanvasRenderingContext2D, roleBadge: RoleBadge) {
  ctx.save();
  ctx.fillStyle = '#FFD700';
  ctx.font = '800 28px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GOA, INDIA • 2:47 PM STUDIO', 600, 1030);

  if (roleBadge !== 'NONE') {
    drawRoleBadgePill(ctx, roleBadge, 600, 1090);
  }
  ctx.restore();
}

function drawRoleBadgePill(ctx: CanvasRenderingContext2D, badge: RoleBadge, x: number, y: number) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const text = `✦ ${badge} ✦`;
  ctx.font = '900 18px system-ui, sans-serif';
  const metrics = ctx.measureText(text);
  const padX = 24;
  const w = metrics.width + padX * 2;
  const h = 36;

  // Outer gold stroke pill
  ctx.fillStyle = '#FF007A';
  drawRoundRectPath(ctx, x - w / 2, y - h / 2, w, h, 18);
  ctx.fill();

  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  setCanvasLetterSpacing(ctx, '2px');
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

/**
 * Draws a stylized vector Palm Tree on canvas
 */
function drawPalmTree(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number = 1.0,
  flip: boolean = false
) {
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-scale, scale);
  else ctx.scale(scale, scale);

  // Trunk
  ctx.beginPath();
  ctx.moveTo(-10, 80);
  ctx.quadraticCurveTo(-15, 0, -35, -90);
  ctx.quadraticCurveTo(-20, 0, 0, 80);
  ctx.closePath();
  ctx.fillStyle = '#052219';
  ctx.fill();

  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Leaves
  const leaves = [
    { startAngle: -0.2, len: 110, curve: -40 },
    { startAngle: -0.7, len: 120, curve: -60 },
    { startAngle: -1.2, len: 130, curve: -70 },
    { startAngle: -1.8, len: 110, curve: -50 },
    { startAngle: -2.3, len: 90, curve: -30 },
  ];

  ctx.fillStyle = '#0B3D2E';
  ctx.strokeStyle = '#FFE81A';
  ctx.lineWidth = 2.5;

  leaves.forEach((leaf) => {
    ctx.save();
    ctx.translate(-35, -90);
    ctx.rotate(leaf.startAngle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(leaf.len * 0.5, leaf.curve, leaf.len, 0);
    ctx.quadraticCurveTo(leaf.len * 0.5, leaf.curve + 25, 0, 0);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  ctx.restore();
}

/**
 * Utility to convert canvas output to Blob
 */
export function getCanvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas blob generation failed'));
    }, 'image/png');
  });
}

/**
 * Utility to convert canvas output to Base64 Data URL
 */
export function getCanvasDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Composites an Official Hacker House Goa 2026 ID Pass / Badge Card (1000x1400px).
 */
export async function compositeIDCardImage(
  imageElement: HTMLImageElement,
  transform: TransformState,
  details: IdCardDetails,
  targetCanvas?: HTMLCanvasElement
): Promise<HTMLCanvasElement> {
  const canvas = targetCanvas || document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1400;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas 2D context');

  ctx.clearRect(0, 0, 1000, 1400);

  // 1. Card Background & Texture
  drawIDCardBackground(ctx, details.theme);

  // 2. Top Lanyard Hole & Clip
  if (details.showLanyard) {
    drawLanyardClip(ctx, 500, 48);
  }

  // 3. Header Branding
  drawIDCardHeader(ctx, details);

  // 4. Photo Frame Slot (Center: 500, 440 | 480x480)
  const slot: PhotoSlotConfig = {
    cx: 500,
    cy: 440,
    width: 460,
    height: 460,
    radius: 32,
    shape: 'squircle',
  };

  // Outer glowing frame border
  ctx.save();
  const themeKey = (details.theme || 'classic').toLowerCase();
  const frameColor =
    themeKey === 'sunset'
      ? '#F97316'
      : themeKey === 'holo'
      ? '#EC4899'
      : themeKey === 'cyber'
      ? '#10B981'
      : themeKey === 'minimal'
      ? '#E2E8F0'
      : themeKey === 'bold' || themeKey === 'badge'
      ? '#F59E0B'
      : themeKey === 'poster'
      ? '#FACC15'
      : '#FFD700';

  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 10;
  drawRoundRectPath(
    ctx,
    slot.cx - slot.width / 2 - 5,
    slot.cy - slot.height / 2 - 5,
    slot.width + 10,
    slot.height + 10,
    slot.radius + 4
  );
  ctx.stroke();

  // Draw user image inside clipped region
  clipSlotPath(ctx, slot);
  ctx.fillStyle = '#051F17';
  ctx.fill();
  drawTransformedImage(ctx, imageElement, slot, transform);
  ctx.restore();

  // 5. Participant Name & Handle
  drawParticipantInfo(ctx, details);

  // 6. Role & Track Badges
  drawBadgesSection(ctx, details);

  // 7. Custom Motto
  if (details.motto) {
    drawMottoSection(ctx, details.motto);
  }

  // 8. Footer Barcode & QR Code Section
  await drawFooterPassMeta(ctx, details);

  return canvas;
}

function drawIDCardBackground(ctx: CanvasRenderingContext2D, theme: string) {
  ctx.save();

  // Outer Card Margins (Rounded Pass Card look)
  ctx.fillStyle = '#02120C';
  ctx.fillRect(0, 0, 1000, 1400);

  const cardX = 30;
  const cardY = 30;
  const cardW = 940;
  const cardH = 1340;
  const cardR = 40;

  // Create Theme Gradient
  const t = (theme || 'classic').toLowerCase();
  let gradient: CanvasGradient;
  if (t === 'sunset') {
    gradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    gradient.addColorStop(0, '#3B0764');
    gradient.addColorStop(0.5, '#701A75');
    gradient.addColorStop(1, '#1A0413');
  } else if (t === 'holo') {
    gradient = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    gradient.addColorStop(0, '#0F172A');
    gradient.addColorStop(0.5, '#312E81');
    gradient.addColorStop(1, '#030712');
  } else if (t === 'cyber') {
    gradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    gradient.addColorStop(0, '#0F172A');
    gradient.addColorStop(0.5, '#064E3B');
    gradient.addColorStop(1, '#022C22');
  } else if (t === 'minimal') {
    gradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    gradient.addColorStop(0, '#1E293B');
    gradient.addColorStop(0.5, '#0F172A');
    gradient.addColorStop(1, '#020617');
  } else if (t === 'bold' || t === 'badge') {
    gradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    gradient.addColorStop(0, '#1C1917');
    gradient.addColorStop(0.5, '#292524');
    gradient.addColorStop(1, '#0C0A09');
  } else if (t === 'poster') {
    gradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
    gradient.addColorStop(0, '#450A0A');
    gradient.addColorStop(0.5, '#7C2D12');
    gradient.addColorStop(1, '#180805');
  } else {
    // Emerald / Classic
    gradient = ctx.createRadialGradient(500, 500, 100, 500, 700, 800);
    gradient.addColorStop(0, '#0F523E');
    gradient.addColorStop(0.6, '#0B3D2E');
    gradient.addColorStop(1, '#042219');
  }

  // Draw Main Pass Card
  ctx.fillStyle = gradient;
  drawRoundRectPath(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.fill();

  // Card Outer Stroke Border
  const borderColor =
    t === 'sunset'
      ? '#F97316'
      : t === 'holo'
      ? '#38BDF8'
      : t === 'cyber'
      ? '#10B981'
      : t === 'minimal'
      ? '#E2E8F0'
      : t === 'bold' || t === 'badge'
      ? '#F59E0B'
      : t === 'poster'
      ? '#FACC15'
      : '#FFD700';

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Inner Subtle Golden Hairline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  drawRoundRectPath(ctx, cardX + 12, cardY + 12, cardW - 24, cardH - 24, cardR - 8);
  ctx.stroke();

  // Background Palm silhouettes
  drawPalmTree(ctx, 80, 1250, 0.9, false);
  drawPalmTree(ctx, 920, 1250, 0.9, true);

  ctx.restore();
}

function drawLanyardClip(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();

  // Lanyard Strap (Fabric texture extending upwards)
  const strapGradient = ctx.createLinearGradient(cx - 30, 0, cx + 30, 0);
  strapGradient.addColorStop(0, '#000000');
  strapGradient.addColorStop(0.5, '#1C1917');
  strapGradient.addColorStop(1, '#000000');

  ctx.fillStyle = strapGradient;
  ctx.fillRect(cx - 35, 0, 70, cy - 10);

  // Strap Text "HACKER HOUSE"
  ctx.save();
  ctx.translate(cx, cy / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#FFD700';
  ctx.font = '900 11px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HACKER HOUSE', 0, 0);
  ctx.restore();

  // Metallic Hole Grommet Ring
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Hole Inner Cutout
  ctx.fillStyle = '#02120C';
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  // Metal Clip / Hook
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 16, Math.PI * 0.2, Math.PI * 0.8, true);
  ctx.stroke();

  ctx.restore();
}

function drawIDCardHeader(ctx: CanvasRenderingContext2D, details: IdCardDetails) {
  ctx.save();

  // Main Event Banner Title
  ctx.fillStyle = '#FFD700';
  ctx.font = '900 48px "Georgia", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HACKER HOUSE', 500, 105);

  // Devanagari Goa Pink Logo Overlaid
  ctx.fillStyle = '#FF007A';
  ctx.font = '900 32px system-ui, sans-serif';
  ctx.fillText('गोवा 2026', 500, 148);

  // Official Pass Tag Pill
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
  ctx.lineWidth = 1.5;
  drawRoundRectPath(ctx, 350, 172, 300, 28, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFE81A';
  ctx.font = '800 13px system-ui';
  setCanvasLetterSpacing(ctx, '2px');
  ctx.fillText('• OFFICIAL DELEGATE PASS •', 500, 186);

  ctx.restore();
}

function drawParticipantInfo(ctx: CanvasRenderingContext2D, details: IdCardDetails) {
  ctx.save();
  ctx.textAlign = 'center';

  // Participant Full Name
  const nameY = 720;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 46px system-ui, sans-serif';
  const displayName = details.name.trim() || 'Hacker House Delegate';
  ctx.fillText(displayName, 500, nameY);

  // X / Social Handle
  const handleY = 768;
  const handleText = details.handle.startsWith('@') ? details.handle : `@${details.handle.trim() || 'builder'}`;
  const t = (details.theme || 'classic').toLowerCase();
  ctx.fillStyle =
    t === 'sunset'
      ? '#FFD700'
      : t === 'cyber'
      ? '#34D399'
      : t === 'holo'
      ? '#38BDF8'
      : t === 'minimal'
      ? '#94A3B8'
      : t === 'bold' || t === 'badge'
      ? '#FBBF24'
      : t === 'poster'
      ? '#FDE047'
      : '#34D399';
  ctx.font = '700 28px monospace';
  ctx.fillText(handleText, 500, handleY);

  ctx.restore();
}

function drawBadgesSection(ctx: CanvasRenderingContext2D, details: IdCardDetails) {
  ctx.save();

  const startY = 820;

  // Role Badge Pill (uses customRole if non-empty, else details.role)
  const displayRole = details.customRole?.trim()
    ? details.customRole.trim()
    : details.role !== 'NONE'
    ? details.role
    : 'BUILDER';

  drawRolePillLarge(ctx, displayRole, 330, startY);

  // Track Badge Pill
  drawTrackPillLarge(ctx, details.track, 670, startY);

  ctx.restore();
}

function drawRolePillLarge(ctx: CanvasRenderingContext2D, role: string, x: number, y: number) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const label = role.toUpperCase();
  ctx.font = '900 20px system-ui';
  const metrics = ctx.measureText(label);
  const w = Math.max(220, metrics.width + 48);
  const h = 48;

  // Background Gradient Fill
  const grad = ctx.createLinearGradient(x - w / 2, y, x + w / 2, y);
  grad.addColorStop(0, '#FF007A');
  grad.addColorStop(1, '#E11D48');

  ctx.fillStyle = grad;
  drawRoundRectPath(ctx, x - w / 2, y - h / 2, w, h, 24);
  ctx.fill();

  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`✦ ${label}`, x, y + 1);

  ctx.restore();
}

function drawTrackPillLarge(ctx: CanvasRenderingContext2D, track: string, x: number, y: number) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const label = track || 'AI & Agents';
  ctx.font = '800 18px system-ui';
  const metrics = ctx.measureText(label);
  const w = Math.max(220, metrics.width + 40);
  const h = 48;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  drawRoundRectPath(ctx, x - w / 2, y - h / 2, w, h, 24);
  ctx.fill();

  ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#6EE7B7';
  ctx.fillText(`🚀 ${label}`, x, y + 1);

  ctx.restore();
}

function drawMottoSection(ctx: CanvasRenderingContext2D, motto: string) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'italic 500 22px system-ui, sans-serif';

  const cleanMotto = motto.length > 60 ? motto.slice(0, 57) + '...' : motto;
  ctx.fillText(`"${cleanMotto}"`, 500, 900);

  ctx.restore();
}

async function drawFooterPassMeta(ctx: CanvasRenderingContext2D, details: IdCardDetails) {
  ctx.save();

  const footerY = 960;
  const footerH = 310;
  const footerX = 70;
  const footerW = 860;

  // Footer Card Base Panel
  ctx.fillStyle = 'rgba(5, 20, 15, 0.85)';
  drawRoundRectPath(ctx, footerX, footerY, footerW, footerH, 24);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Left Side: Barcode Graphic & Serial ID
  const barcodeX = footerX + 40;
  const barcodeY = footerY + 40;
  drawBarcodeGraphic(ctx, barcodeX, barcodeY, 440, 120, details.idNumber || 'HHG-2026-0842');

  // Serial Number below Barcode
  ctx.fillStyle = '#FFD700';
  ctx.font = '700 24px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`PASS ID: ${details.idNumber || 'HHG-2026-0842'}`, barcodeX, barcodeY + 170);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '600 16px system-ui';
  ctx.fillText('GOA, INDIA • OCT 29-31 2026', barcodeX, barcodeY + 205);

  // Right Side: Real Generated QR Code Matrix
  const qrSize = 190;
  const qrX = footerX + footerW - qrSize - 40;
  const qrY = footerY + 35;
  await drawQRCodeMatrix(ctx, qrX, qrY, qrSize, details.handle);

  ctx.restore();
}

function drawBarcodeGraphic(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string
) {
  ctx.save();

  // White Background Box for Barcode
  ctx.fillStyle = '#FFFFFF';
  drawRoundRectPath(ctx, x, y, w, h, 8);
  ctx.fill();

  // Deterministic bar generator based on text characters
  const barCount = 58;
  const barWidth = (w - 30) / barCount;

  ctx.fillStyle = '#000000';
  for (let i = 0; i < barCount; i++) {
    const charCode = text.charCodeAt(i % text.length) || 65;
    const isWide = (charCode + i) % 3 === 0;
    const barX = x + 15 + i * barWidth;

    if (i % 5 !== 0) {
      ctx.fillRect(barX, y + 12, isWide ? barWidth * 0.8 : barWidth * 0.4, h - 24);
    }
  }

  ctx.restore();
}

async function drawQRCodeMatrix(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  handle: string
) {
  ctx.save();

  // QR Container White Card
  ctx.fillStyle = '#FFFFFF';
  drawRoundRectPath(ctx, x, y, size, size, 16);
  ctx.fill();

  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Formulate real scannable payload URL
  let targetUrl = (handle || '').trim();
  if (!targetUrl) {
    targetUrl = 'https://x.com/hackerhousegoa';
  } else if (targetUrl.startsWith('@')) {
    targetUrl = `https://x.com/${targetUrl.slice(1)}`;
  } else if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = `https://x.com/${targetUrl}`;
  }

  try {
    const tempCanvas = document.createElement('canvas');
    const innerPadding = 14;
    const qrDrawSize = size - innerPadding * 2;

    await QRCode.toCanvas(tempCanvas, targetUrl, {
      width: qrDrawSize,
      margin: 1,
      color: {
        dark: '#033E25', // Deep Goa Emerald modules
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });

    ctx.drawImage(tempCanvas, x + innerPadding, y + innerPadding, qrDrawSize, qrDrawSize);
  } catch (err) {
    console.error('QR code generation failed:', err);
  }

  ctx.restore();
}
