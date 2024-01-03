import { copilotConfig } from '../copilot-service/copilot-config.js';
import { Image2ImageServiceKind } from '../copilot-service/service-base.js';

export const editImage = (prompt: string, canvas?: HTMLCanvasElement) => {
  if (!canvas) {
    return;
  }
  return copilotConfig
    .getService('edit image', Image2ImageServiceKind)
    .generateImage(prompt, canvas.toDataURL());
};
export const genMask = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return new Promise<File>(res => {
    canvas.toBlob(blob => res(new File([blob!], 'mask.png')));
  });
};
export const pngBase64ToFile = (base64: string, filename: string) => {
  const bstr = atob(base64);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: 'image/png' });
};

export const jpegBase64ToFile = (base64: string, filename: string) => {
  const bstr = atob(base64.split(',')[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {
    type: 'image/jpeg',
  });
};
