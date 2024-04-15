import { fetchImage } from '@blocksuite/blocks';
import { assertExists } from '@blocksuite/global/utils';

export async function fetchImageToFile(
  url: string,
  filename: string,
  imageProxy?: string
): Promise<File | void> {
  try {
    const res = await fetchImage(url, undefined, imageProxy);
    if (res.ok) {
      let blob = await res.blob();
      if (!blob.type || !blob.type.startsWith('image/')) {
        blob = await convertToPng(blob).then(tmp => tmp || blob);
      }
      return new File([blob], filename, { type: blob.type || 'image/png' });
    }
  } catch (err) {
    console.error(err);
  }

  return fetchImageFallback(url, filename);
}

function fetchImageFallback(
  url: string,
  filename: string
): Promise<File | void> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      assertExists(ctx);
      ctx.drawImage(img, 0, 0);
      c.toBlob(blob => {
        if (blob) {
          return resolve(new File([blob], filename, { type: blob.type }));
        }
        resolve();
      }, 'image/png');
    };
    img.onerror = () => resolve();
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

function convertToPng(blob: Blob): Promise<Blob | null> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.addEventListener('load', _ => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        assertExists(ctx);
        ctx.drawImage(img, 0, 0);
        c.toBlob(resolve, 'image/png');
      };
      img.onerror = () => resolve(null);
      img.src = reader.result as string;
    });
    reader.addEventListener('error', () => resolve(null));
    reader.readAsDataURL(blob);
  });
}
