import heic2any from 'heic2any';

/**
 * Checks if a file is an HEIC or HEIF image based on MIME type or extension.
 */
export function isHeicFile(file: File): boolean {
  if (!file) return false;
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  return (
    mimeType.includes('heic') ||
    mimeType.includes('heif') ||
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif')
  );
}

/**
 * Converts HEIC/HEIF file to JPEG blob using client-side heic2any library.
 */
export async function convertHeicToJpeg(file: File): Promise<Blob> {
  try {
    const result = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    });

    if (Array.isArray(result)) {
      return result[0];
    }
    return result;
  } catch (err) {
    console.error('HEIC conversion failed:', err);
    throw new Error('Failed to process HEIC file. Please try uploading a JPG or PNG instead.');
  }
}
