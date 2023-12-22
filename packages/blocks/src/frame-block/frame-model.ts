import type { Text } from '@blocksuite/store';
import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import { FRAME_BATCH } from '../surface-block/batch.js';
import { getTextRect } from '../surface-block/elements/text/utils.js';
import {
  Bound,
  type HitTestOptions,
  type SerializedXYWH,
} from '../surface-block/index.js';

type FrameBlockProps = {
  title: Text;
  background: string;
  xywh: SerializedXYWH;
  index: string;
};

export const FrameBlockSchema = defineBlockSchema({
  flavour: 'affine:frame',
  props: (internal): FrameBlockProps => ({
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

export class FrameBlockModel extends selectable<FrameBlockProps>(
  BaseBlockModel
) {
  static PADDING = [8, 10];

  override batch = FRAME_BATCH;
  override hitTest(x: number, y: number, _: HitTestOptions): boolean {
    const bound = Bound.deserialize(this.xywh);
    const hit = bound.isPointNearBound([x, y], 5);
    const zoom = _.zoom ?? 1;

    if (hit) return true;

    const titleRect = getTextRect(this.title.toString(), 'Inter', 14);

    titleRect.w = (titleRect.w + FrameBlockModel.PADDING[1] * 2) / zoom;
    titleRect.h = (titleRect.h + FrameBlockModel.PADDING[0] * 2) / zoom;

    bound.y -= titleRect.h;
    bound.w = titleRect.w;
    bound.h = titleRect.h;

    return bound.isPointInBound([x, y]);
  }

  override boxSelect(seclectedBound: Bound): boolean {
    const bound = Bound.deserialize(this.xywh);
    return (
      bound.isIntersectWithBound(seclectedBound) ||
      seclectedBound.contains(bound)
    );
  }
}
