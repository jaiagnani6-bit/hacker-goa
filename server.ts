import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface StoredImage {
  buffer: Buffer;
  contentType: string;
  createdAt: number;
}

const app = express();
const PORT = 3000;

// Increase JSON payload size limit for image uploads
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// In-memory store for shared images (expires after 7 days)
const imageStore = new Map<string, StoredImage>();
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Periodic cleanup of expired images every hour
setInterval(() => {
  const now = Date.now();
  for (const [id, item] of imageStore.entries()) {
    if (now - item.createdAt > EXPIRY_MS) {
      imageStore.delete(id);
    }
  }
}, 60 * 60 * 1000);

// Generate unique ID
function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// API Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Upload endpoint
app.post('/api/upload', (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Missing image data' });
    }

    // Extract base64
    let base64Data = image;
    let contentType = 'image/png';

    if (image.includes(';base64,')) {
      const parts = image.split(';base64,');
      const match = parts[0].match(/data:(image\/\w+)/);
      if (match) contentType = match[1];
      base64Data = parts[1];
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const id = generateId();

    imageStore.set(id, {
      buffer,
      contentType,
      createdAt: Date.now(),
    });

    // Host detection
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const baseUrl = process.env.APP_URL || `${protocol}://${host}`;

    const shareUrl = `${baseUrl}/i/${id}`;
    const imageUrl = `${baseUrl}/api/image/${id}`;

    res.json({
      success: true,
      id,
      shareUrl,
      imageUrl,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process image upload' });
  }
});

// Serve raw image endpoint
app.get('/api/image/:id', (req, res) => {
  const { id } = req.params;
  const stored = imageStore.get(id);

  if (!stored) {
    return res.status(404).send('Image not found or expired');
  }

  res.setHeader('Content-Type', stored.contentType);
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
  res.setHeader('Content-Length', stored.buffer.length);
  res.end(stored.buffer);
});

// Share HTML page for Twitter / X crawler and human visitors
app.get('/i/:id', (req, res) => {
  const { id } = req.params;
  const stored = imageStore.get(id);

  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host') || 'localhost:3000';
  const baseUrl = process.env.APP_URL || `${protocol}://${host}`;

  const imageUrl = `${baseUrl}/api/image/${id}`;
  const shareUrl = `${baseUrl}/i/${id}`;

  if (!stored) {
    // Expired or invalid ID
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>HH Goa 2026 - Image Expired</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0B3D2E; color: #fff; text-align: center; padding: 3rem 1rem; }
          .card { background: #0A3326; max-width: 480px; margin: 0 auto; padding: 2rem; border-radius: 16px; border: 1px solid #FFD700; }
          a { display: inline-block; margin-top: 1.5rem; background: #FFD700; color: #0B3D2E; padding: 0.75rem 1.5rem; font-weight: bold; text-decoration: none; border-radius: 9999px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Image Not Found or Expired</h2>
          <p>This profile picture link has expired or is invalid. Create your own HH Goa 2026 PFP frame in seconds!</p>
          <a href="/">Create Your #FrameInGoa PFP</a>
        </div>
      </body>
      </html>
    `);
  }

  // HTML page with Open Graph and Twitter Card tags
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>HH Goa 2026 Profile Picture #FrameInGoa</title>
  
  <!-- Primary Meta Tags -->
  <meta name="title" content="HH Goa 2026 Profile Picture #FrameInGoa" />
  <meta name="description" content="Official Hacker House Goa 2026 Branded PFP Graphic (29 - 31 Oct 2026). Create yours now!" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${shareUrl}" />
  <meta property="og:title" content="HH Goa 2026 Profile Picture #FrameInGoa" />
  <meta property="og:description" content="Hacker House Goa 2026 Branded PFP Graphic. Join us in Goa, India!" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="1200" />
  <meta property="og:image:type" content="image/png" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${shareUrl}" />
  <meta name="twitter:title" content="HH Goa 2026 Profile Picture #FrameInGoa" />
  <meta name="twitter:description" content="Hacker House Goa 2026 Branded PFP Graphic. Join us in Goa, India!" />
  <meta name="twitter:image" content="${imageUrl}" />

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #07291F;
      background-image: radial-gradient(circle at 50% 20%, #0F523E 0%, #07291F 100%);
      color: #F8FAFC;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .container {
      max-width: 460px;
      width: 100%;
      background: rgba(10, 51, 38, 0.95);
      border: 2px solid #FFD700;
      border-radius: 24px;
      padding: 2rem 1.5rem;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    }
    .tag {
      display: inline-block;
      background: #FFD700;
      color: #0B3D2E;
      font-weight: 800;
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      margin-bottom: 1rem;
    }
    h1 {
      font-size: 1.5rem;
      color: #FFE81A;
      margin-bottom: 0.25rem;
    }
    p {
      color: #CBD5E1;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }
    .image-preview {
      width: 100%;
      aspect-ratio: 1/1;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      margin-bottom: 1.5rem;
      background: #000;
    }
    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.85rem 1.25rem;
      font-weight: 700;
      font-size: 0.95rem;
      border-radius: 12px;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .btn-primary {
      background: #FFD700;
      color: #07291F;
    }
    .btn-primary:hover {
      background: #FFE81A;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #FFF;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  </style>
</head>
<body>
  <div class="container">
    <span class="tag">HACKER HOUSE GOA 2026</span>
    <h1>#FrameInGoa Profile Picture</h1>
    <p>Goa, India • 29 - 31 Oct 2026</p>
    
    <div class="image-preview">
      <img src="${imageUrl}" alt="HH Goa 2026 Branded PFP" />
    </div>

    <div class="actions">
      <a href="${imageUrl}" download="hhgoa2026-pfp.png" class="btn btn-primary">
        ⬇️ Download Image PNG
      </a>
      <a href="/" class="btn btn-secondary">
        ✨ Create Your Own PFP Frame
      </a>
    </div>
  </div>
</body>
</html>`);
});

// Vite or Static file middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HH Goa 2026 PFP Frame Generator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
