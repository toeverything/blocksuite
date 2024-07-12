import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import type { SerializedXYWH } from '../surface-block/index.js';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import { ImageBlockTransformer } from './image-transformer.js';

export type ImageBlockProps = {
  caption?: string;
  height?: number;
  index: string;
  rotate: number;
  size?: number;
  sourceId?: string;
  width?: number;
  xywh: SerializedXYWH;
};

const defaultImageProps: ImageBlockProps = {
  caption: '',
  height: 0,
  index: 'a0',
  rotate: 0,
  size: -1,
  sourceId: '',
  width: 0,
  xywh: '[0,0,0,0]',
};

export const ImageBlockSchema = defineBlockSchema({
  flavour: 'affine:image',
  metadata: {
    role: 'content',
    version: 1,
  },
  props: () => defaultImageProps,
  toModel: () => new ImageBlockModel(),
  transformer: () => new ImageBlockTransformer(),
});

export class ImageBlockModel extends selectable<ImageBlockProps>(BlockModel) {}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:image': ImageBlockModel;
    }
  }
}
