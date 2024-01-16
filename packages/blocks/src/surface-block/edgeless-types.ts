import type { BookmarkBlockModel } from '../bookmark-block/bookmark-model.js';
import type { FrameBlockModel } from '../frame-block/index.js';
import type { ImageBlockModel } from '../image-block/image-model.js';
import type { NoteBlockModel } from '../note-block/note-model.js';

export type EdgelessBlockModelMap = {
  'affine:frame': FrameBlockModel;
  'affine:note': NoteBlockModel;
  'affine:image': ImageBlockModel;
  'affine:bookmark': BookmarkBlockModel;
};

export type EdgelessBlockType =
  | 'affine:frame'
  | 'affine:note'
  | 'affine:image'
  | 'affine:bookmark';

export type EdgelessElementType =
  | EdgelessBlockType
  | 'shape'
  | 'brush'
  | 'connector'
  | 'text'
  | 'group'
  | 'debug';
