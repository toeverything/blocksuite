import { BaseBlockModel } from '@blocksuite/store';

import { BLOCK_BATCH } from '../../surface-block/batch.js';
import type {
  IEdgelessElement,
  IVec,
  PointLocation,
  SerializedXYWH,
} from '../../surface-block/index.js';
import { Bound } from '../../surface-block/index.js';
import type { EmbedProps } from './types.js';

export class EmbedBlockModel<Props = object>
  extends BaseBlockModel<EmbedProps<Props>>
  implements IEdgelessElement
{
  elementBound!: Bound;
  override xywh!: SerializedXYWH;
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
