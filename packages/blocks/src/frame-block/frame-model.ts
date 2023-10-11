import type { Text } from '@blocksuite/store';
import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import { BLOCK_ID_ATTR } from '../__internal__/consts.js';
import type { SurfaceBlockComponent } from '../index.js';
import { FRAME_BATCH } from '../surface-block/batch.js';
import type { EdgelessBlockType } from '../surface-block/edgeless-types.js';
import type {
  HitTestOptions,
  IEdgelessElement,
} from '../surface-block/elements/edgeless-element.js';
import {
  Bound,
  type IVec,
  linePolygonIntersects,
  type PointLocation,
  type SerializedXYWH,
} from '../surface-block/index.js';
import type { FrameBlockComponent } from './frame-block.js';

export const FrameBlockSchema = defineBlockSchema({
  flavour: 'affine:frame',
  props: internal => ({
    title: internal.Text(),
    background: '--affine-palette-transparent',
    xywh: `[0,0,100,100]`,
    index: 'a0',
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: ['affine:surface'],
    children: [],
  },
  toModel: () => {
    return new FrameBlockModel();
  },
});

type Props = {
  title: Text;
  background: string;
  xywh: SerializedXYWH;
  index: string;
};

export class FrameBlockModel
  extends BaseBlockModel<Props>
  implements IEdgelessElement
{
  override flavour!: EdgelessBlockType.FRAME;

  get connectable() {
    return false;
  }

  get batch() {
    return FRAME_BATCH;
  }

  get rotate() {
    return 0;
  }

  containedByBounds(bound: Bound): boolean {
    return bound.contains(Bound.deserialize(this.xywh));
  }
  getNearestPoint(_: IVec): IVec {
    throw new Error('Function not implemented.');
  }
  intersectWithLine(start: IVec, end: IVec): PointLocation[] | null {
    return linePolygonIntersects(
      start,
      end,
      Bound.deserialize(this.xywh).points
    );
  }
  getRelativePointLocation(_: IVec): PointLocation {
    throw new Error('Function not implemented.');
  }
  hitTest(
    x: number,
    y: number,
    _: HitTestOptions,
    surface: SurfaceBlockComponent
  ): boolean {
    const block = surface.parentBlockElement.querySelector(
      `[${BLOCK_ID_ATTR}="${this.id}"]`
    ) as FrameBlockComponent;
    if (!block) return false;
    const titleBound = block.titleBound;
    return titleBound.isPointInBound([x, y], 0);
  }
  boxSelect(bound: Bound): boolean {
    return Bound.deserialize(this.xywh).isIntersectWithBound(bound);
  }
}
