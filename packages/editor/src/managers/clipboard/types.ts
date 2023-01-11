import type { DeltaOperation } from 'quill';

export enum CLIPBOARD_MIMETYPE {
  BLOCKS_CLIP_WRAPPED = 'blocksuite/x-c+w',
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

export interface SelectedBlock {
  id: string;
  startPos?: number;
  endPos?: number;
  children: SelectedBlock[];
  sourceId?: string;
  caption?: string;
}

export type OpenBlockInfo = {
  flavour: string;
  type: string;
  text: DeltaOperation[];
  checked?: boolean;
  children: OpenBlockInfo[];
  sourceId?: string;
  caption?: string;
  width?: number;
  height?: number;
  language?: string;
};
