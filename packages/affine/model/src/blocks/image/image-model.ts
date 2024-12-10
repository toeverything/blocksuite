import type {
  GfxCommonBlockProps,
  GfxElementGeometry,
} from '@blocksuite/block-std/gfx';

import { GfxCompatible } from '@blocksuite/block-std/gfx';
import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import { ImageBlockTransformer } from './image-transformer.js';

export type ImageBlockProps = {
  caption?: string;
  sourceId?: string;
  width?: number;
  height?: number;
  rotate: number;
  size?: number;
} & Omit<GfxCommonBlockProps, 'scale'>;

const defaultImageProps: ImageBlockProps = {
  caption: '',
  sourceId: '',
  width: 0,
  height: 0,
  index: 'a0',
  xywh: '[0,0,0,0]',
  lockedBySelf: false,
  rotate: 0,
  size: -1,
};

export const ImageBlockSchema = defineBlockSchema({
  flavour: 'affine:image',
  props: () => defaultImageProps,
  metadata: {
    version: 1,
    role: 'content',
  },
  transformer: () => new ImageBlockTransformer(),
  toModel: () => new ImageBlockModel(),
});

export class ImageBlockModel
  extends GfxCompatible<ImageBlockProps>(BlockModel)
  implements GfxElementGeometry {}

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:image': ImageBlockModel;
    }
    interface EdgelessBlockModelMap {
      'affine:image': ImageBlockModel;
    }
  }
}
