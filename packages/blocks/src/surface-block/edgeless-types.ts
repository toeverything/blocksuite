import type { BlockProps } from '@blocksuite/store';

import type {
  IElementCreateProps,
  PhasorElementType,
} from './elements/edgeless-element.js';

export enum EdgelessBlockType {
  FRAME = 'affine:frame',
  NOTE = 'affine:note',
}

export enum EdgelessElementType {
  FRAME = 'affine:frame',
  NOTE = 'affine:note',
  SHAPE = 'shape',
  BRUSH = 'brush',
  CONNECTOR = 'connector',
  TEXT = 'text',
  DEBUG = 'debug',
}

export type IEdgelessElementCreateProps<T extends EdgelessElementType> =
  T extends PhasorElementType
    ? IElementCreateProps<T>
    : Partial<BlockProps & Omit<BlockProps, 'flavour'>>;
