import type { BlockProps } from '@blocksuite/store';

import type { BookmarkBlockModel } from '../bookmark-block/bookmark-model.js';
import type { EmbedGithubModel } from '../embed-github-block/embed-github-model.js';
import type { FrameBlockModel } from '../frame-block/index.js';
import type { ImageBlockModel } from '../image-block/image-model.js';
import type { NoteBlockModel } from '../note-block/note-model.js';
import type {
  CanvasElementType,
  IElementCreateProps,
} from './elements/edgeless-element.js';

export type EdgelessBlockModelMap = {
  'affine:frame': FrameBlockModel;
  'affine:note': NoteBlockModel;
  'affine:image': ImageBlockModel;
  'affine:bookmark': BookmarkBlockModel;
  'affine:embed-github': EmbedGithubModel;
};

export type EdgelessBlockType =
  | 'affine:frame'
  | 'affine:note'
  | 'affine:image'
  | 'affine:bookmark'
  | 'affine:embed-github';

export type EdgelessElementType =
  | EdgelessBlockType
  | 'shape'
  | 'brush'
  | 'connector'
  | 'text'
  | 'group'
  | 'debug';

export type IEdgelessElementCreateProps<T extends EdgelessElementType> =
  T extends CanvasElementType
    ? IElementCreateProps<T>
    : Partial<BlockProps & Omit<BlockProps, 'flavour'>>;
