import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import { BLOCK_BATCH } from '../surface-block/batch.js';
import type { EdgelessBlockType } from '../surface-block/edgeless-types.js';
import { EdgelessSelectableMixin } from '../surface-block/elements/selectable.js';
import type { PointLocation } from '../surface-block/index.js';
import {
  Bound,
  type IEdgelessElement,
  type IVec,
  type SerializedXYWH,
} from '../surface-block/index.js';
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
  toModel: () => {
    return new ImageBlockModel();
  },
});

@EdgelessSelectableMixin
export class ImageBlockModel
  extends BaseBlockModel<ImageBlockProps>
  implements IEdgelessElement
{
  gridBound!: Bound;
  override xywh!: SerializedXYWH;
  override flavour!: EdgelessBlockType.IMAGE;

  constructor() {
    super();

    this.created.on(() => {
      const blobId = this.sourceId;
      const blob = this.page.blobs.get(blobId);
      if (!blob) {
        console.error(`Blob ${blobId} not found in blob manager`);
        return;
      }
      this.page.blobs.increaseRef(blobId);
    });
    this.propsUpdated.on(({ oldProps, newProps }) => {
      const oldBlobId = (oldProps as ImageBlockProps).sourceId;
      const newBlobId = (newProps as ImageBlockProps).sourceId;
      if (oldBlobId === newBlobId) return;

      const oldBlob = this.page.blobs.get(oldBlobId);
      if (!oldBlob) {
        console.error(`Blob ${oldBlobId} not found in blob manager`);
        return;
      }
      const newBlob = this.page.blobs.get(newBlobId);
      if (!newBlob) {
        console.error(`Blob ${newBlobId} not found in blob manager`);
        return;
      }

      this.page.blobs.decreaseRef(oldBlobId);
      this.page.blobs.increaseRef(newBlobId);
    });
    this.deleted.on(() => {
      const blobId = this.sourceId;
      const blob = this.page.blobs.get(blobId);
      if (!blob) {
        console.error(`Blob ${blobId} not found in blob manager`);
        return;
      }

      this.page.blobs.decreaseRef(blobId);
    });
  }

  get batch() {
    return BLOCK_BATCH;
  }

  get connectable() {
    return true;
  }
  containedByBounds!: (_: Bound) => boolean;
  getNearestPoint!: (_: IVec) => IVec;
  intersectWithLine!: (_: IVec, _1: IVec) => PointLocation[] | null;
  getRelativePointLocation!: (_: IVec) => PointLocation;
  boxSelect!: (bound: Bound) => boolean;

  hitTest(x: number, y: number): boolean {
    const bound = Bound.deserialize(this.xywh);
    return bound.isPointInBound([x, y], 0);
  }
}
