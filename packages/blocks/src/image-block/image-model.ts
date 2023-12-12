import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import type { EdgelessBlockType } from '../surface-block/edgeless-types.js';
import { type SerializedXYWH } from '../surface-block/index.js';
import { ImageBlockTransformer } from './image-transformer.js';

export type ImageBlockProps = {
  caption?: string;
  sourceId: string;
  width?: number;
  height?: number;
  index: string;
  xywh: SerializedXYWH;
  rotate: number;
};

const defaultImageProps: ImageBlockProps = {
  caption: '',
  sourceId: '',
  width: 0,
  height: 0,
  index: 'a0',
  xywh: '[0,0,0,0]',
  rotate: 0,
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

export class ImageBlockModel extends selectable<ImageBlockProps>(
  BaseBlockModel
) {
  override flavour!: EdgelessBlockType.IMAGE;
}
