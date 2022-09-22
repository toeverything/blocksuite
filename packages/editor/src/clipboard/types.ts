export enum CLIPBOARD_MIMETYPE {
  BLOCKS_CLIP_WRAPPED = 'custom/blocks',
  HTML = 'text/html',
  TEXT = 'text/plain',
  IMAGE_BMP = 'image/bmp',
  IMAGE_GIF = 'image/gif',
  IMAGE_JPEG = 'image/jpeg',
  IMAGE_JPG = 'image/jpg',
  IMAGE_PNG = 'image/png',
  IMAGE_SVG = 'image/svg',
  IMAGE_WEBP = 'image/webp',
}

export enum ClipboardAction {
  copy = 'copy',
  cut = 'cut',
  paste = 'paste',
}

export type OpenBlockInfo = Record<string, unknown>;
