/**
 * Try keeping this file pure, don't rely on other package or module.
 */
import { ClipboardItem } from '../clipboard-item.js';

export enum CLIPBOARD_MIMETYPE {
  HTML = 'text/html',
  TEXT = 'text/plain',
  BLOCKSUITE_PAGE = 'blocksuite/page',
  BLOCKSUITE_SURFACE = 'blocksuite/surface',
  // IMAGE_BMP = 'image/bmp',
  // IMAGE_GIF = 'image/gif',
  // IMAGE_JPEG = 'image/jpeg',
  // IMAGE_JPG = 'image/jpg',
  // IMAGE_PNG = 'image/png',
  // IMAGE_SVG = 'image/svg',
  // IMAGE_WEBP = 'image/webp',
}

export function extractCustomDataFromHTMLString(
  type: CLIPBOARD_MIMETYPE,
  html: string
) {
  const dom = new DOMParser().parseFromString(html, 'text/html');
  const ele = dom.querySelector(`blocksuite[data-type="${type}"]`);
  return ele?.innerHTML;
}

export function getSurfaceClipboardData(e: ClipboardEvent) {
  const clipboardData = e.clipboardData;
  if (!clipboardData) {
    return;
  }

  // TODO:
  // Because the edgeless mode does not support inserting images separately,
  // the files in the clipboard have not been processed here.
  // if (isPureFileInClipboard(clipboardData) {}

  const data = clipboardData.getData(CLIPBOARD_MIMETYPE.BLOCKSUITE_SURFACE);
  if (data) {
    return JSON.parse(data);
  }

  const HTMLClipboardData = clipboardData.getData(CLIPBOARD_MIMETYPE.HTML);
  const parsedHtmlData = extractCustomDataFromHTMLString(
    CLIPBOARD_MIMETYPE.BLOCKSUITE_SURFACE,
    HTMLClipboardData
  );
  if (parsedHtmlData) {
    return JSON.parse(parsedHtmlData);
  }
}

export function isPureFileInClipboard(clipboardData: DataTransfer) {
  const types = clipboardData.types;
  return (
    (types.length === 1 && types[0] === 'Files') ||
    (types.length === 2 &&
      (types.includes('text/plain') || types.includes('text/html')) &&
      types.includes('Files'))
  );
}

// TODO: support more file types, now is just image
export function getFileFromClipboard(clipboardData: DataTransfer) {
  const files = clipboardData.files;
  if (files && files[0] && files[0].type.indexOf('image') > -1) {
    return files[0];
  }
  return;
}

export function performNativeCopy(items: ClipboardItem[]): boolean {
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
}

export function createSurfaceClipboardItems(data: unknown) {
  const stringifiedData = JSON.stringify(data);

  const surfaceItem = new ClipboardItem(
    CLIPBOARD_MIMETYPE.BLOCKSUITE_SURFACE,
    stringifiedData
  );

  const htmlFallback = new ClipboardItem(
    CLIPBOARD_MIMETYPE.HTML,
    createHTMLStringForCustomData(
      stringifiedData,
      CLIPBOARD_MIMETYPE.BLOCKSUITE_SURFACE
    )
  );

  return [surfaceItem, htmlFallback];
}

export function createHTMLStringForCustomData(
  data: string,
  type: CLIPBOARD_MIMETYPE
) {
  return `<blocksuite style="display: none" data-type="${type}">${data}</blocksuite>`;
}
