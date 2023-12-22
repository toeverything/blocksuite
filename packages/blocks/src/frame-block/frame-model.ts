import type { Text } from '@blocksuite/store';
import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import { FRAME_BATCH } from '../surface-block/batch.js';
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
  override batch = FRAME_BATCH;
  override hitTest(x: number, y: number, _: HitTestOptions): boolean {
    const bound = Bound.deserialize(this.xywh);

    return bound.isPointNearBound([x, y], 5);
  }

  override boxSelect(seclectedBound: Bound): boolean {
    const bound = Bound.deserialize(this.xywh);
    return (
      bound.isIntersectWithBound(seclectedBound) ||
      seclectedBound.contains(bound)
    );
  }
}
