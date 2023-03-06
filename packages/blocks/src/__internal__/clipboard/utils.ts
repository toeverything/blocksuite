import type { ClipboardItem } from './clipboard-item.js';

export enum CLIPBOARD_MIMETYPE {
  BLOCKS_CLIP_WRAPPED = 'blocksuite/x-c+w',
  HTML = 'text/html',
  TEXT = 'text/plain',
  // IMAGE_BMP = 'image/bmp',
  // IMAGE_GIF = 'image/gif',
  // IMAGE_JPEG = 'image/jpeg',
  // IMAGE_JPG = 'image/jpg',
  // IMAGE_PNG = 'image/png',
  // IMAGE_SVG = 'image/svg',
  // IMAGE_WEBP = 'image/webp',
}

export const performNativeCopy = (items: ClipboardItem[]): boolean => {
  let success = false;
  const tempElem = document.createElement('textarea');
  tempElem.value = 'temp';
  document.body.appendChild(tempElem);
  tempElem.select();
  tempElem.setSelectionRange(0, tempElem.value.length);

  const listener = (e: ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (clipboardData) {
      items.forEach((item: ClipboardItem) =>
        clipboardData.setData(item.mimeType, item.data)
      );
    }

    e.preventDefault();
    e.stopPropagation();
    tempElem.removeEventListener('copy', listener);
  };

  tempElem.addEventListener('copy', listener);
  try {
    success = document.execCommand('copy');
  } finally {
    tempElem.removeEventListener('copy', listener);
    document.body.removeChild(tempElem);
  }
  return success;
};

export const isPureFileInClipboard = (clipboardData: DataTransfer) => {
  const types = clipboardData.types;
  return (
    (types.length === 1 && types[0] === 'Files') ||
    (types.length === 2 &&
      (types.includes('text/plain') || types.includes('text/html')) &&
      types.includes('Files'))
  );
};

// TODO: support more file types, now is just image
export const getFileFromClipboard = (clipboardData: DataTransfer) => {
  const files = clipboardData.files;
  if (files && files[0] && files[0].type.indexOf('image') > -1) {
    return files[0];
  }
  return;
};
