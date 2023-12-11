import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import type { EdgelessBlockType } from '../surface-block/edgeless-types.js';
import { BlockEdgelessMixin } from '../surface-block/elements/selectable.js';
import { type SerializedXYWH } from '../surface-block/index.js';
import { ImageBlockTransformer } from './image-transformer.js';

export type ImageBlockProps = {
  caption?: string;
  sourceId: string;
  width?: number;
  height?: number;
  index: string;
  xywh?: SerializedXYWH;
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

const ImageBlockModelEdgeless = BlockEdgelessMixin(
  class extends BaseBlockModel<ImageBlockProps> {
    override xywh!: SerializedXYWH;
    override flavour!: EdgelessBlockType.IMAGE;

    constructor() {
      super();

      this.created.on(() => {
        const blobId = this.sourceId;
        const blob = this.page.blob.get(blobId);
        if (!blob) {
          console.error(`Blob ${blobId} not found in blob manager`);
          return;
        }
        this.page.blob.increaseRef(blobId);
      });
      this.deleted.on(() => {
        const blobId = this.sourceId;
        const blob = this.page.blob.get(blobId);
        if (!blob) {
          console.error(`Blob ${blobId} not found in blob manager`);
          return;
        }

        this.page.blob.decreaseRef(blobId);
      });
    }
  }
);

export class ImageBlockModel extends ImageBlockModelEdgeless {}
