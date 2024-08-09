import type { GfxElementGeometry } from '@blocksuite/block-std/gfx';
import type { SerializedXYWH } from '@blocksuite/global/utils';

import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import { GfxCompatible } from '../../utils/index.js';
import { ImageBlockTransformer } from './image-transformer.js';

export type ImageBlockProps = {
  caption?: string;
  sourceId?: string;
  width?: number;
  height?: number;
  index: string;
  xywh: SerializedXYWH;
  rotate: number;
  size?: number;
};

const defaultImageProps: ImageBlockProps = {
  caption: '',
  sourceId: '',
  width: 0,
  height: 0,
  index: 'a0',
  xywh: '[0,0,0,0]',
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
