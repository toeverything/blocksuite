import { assertExists } from '@blocksuite/global/utils';
import type { Text } from '@blocksuite/store';
import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import { getBlockElementByPath } from '../_common/utils/query.js';
import { FRAME_BATCH } from '../surface-block/batch.js';
import type { EdgelessBlockType } from '../surface-block/edgeless-types.js';
import type {
  HitTestOptions,
  IEdgelessElement,
} from '../surface-block/elements/edgeless-element.js';
import { EdgelessSelectableMixin } from '../surface-block/elements/selectable.js';
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

@EdgelessSelectableMixin
export class FrameBlockModel
  extends BaseBlockModel<Props>
  implements IEdgelessElement
{
  override flavour!: EdgelessBlockType.FRAME;

  get connectable() {
    return true;
  }

  get batch() {
    return FRAME_BATCH;
  }

  get rotate() {
    return 0;
  }

  get elementBound() {
    return Bound.deserialize(this.xywh);
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
  getRelativePointLocation!: (_: IVec) => PointLocation;
  hitTest(x: number, y: number, _: HitTestOptions): boolean {
    const bound = Bound.deserialize(this.xywh);
    const hit = bound.isPointOnBound([x, y]);
    if (hit) return true;

    assertExists(this.page.root);
    const block = getBlockElementByPath([
      this.page.root?.id,
      this.id,
    ]) as FrameBlockComponent;
    if (!block) return false;
    const titleBound = block.titleBound;
    return titleBound.isPointInBound([x, y], 0);
  }
  boxSelect(bound: Bound): boolean {
    return Bound.deserialize(this.xywh).isIntersectWithBound(bound);
  }
}
