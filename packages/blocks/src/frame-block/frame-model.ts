import { assertExists } from '@blocksuite/global/utils';
import type { Text } from '@blocksuite/store';
import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import { getBlockElementByPath } from '../_common/utils/query.js';
import { FRAME_BATCH } from '../surface-block/batch.js';
import type { EdgelessBlockType } from '../surface-block/edgeless-types.js';
import { BlockEdgelessMixin } from '../surface-block/elements/selectable.js';
import { Bound, type SerializedXYWH } from '../surface-block/index.js';
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
  rotate: number;
};

const FrameBlockModelEdgeless = BlockEdgelessMixin(
  class extends BaseBlockModel<Props> {
    override flavour!: EdgelessBlockType.FRAME;
  }
);

export class FrameBlockModel extends FrameBlockModelEdgeless {
  override batch = FRAME_BATCH;
  override rotate = 0;

  override hitTest(x: number, y: number): boolean {
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

  override boxSelect(bound: Bound): boolean {
    return Bound.deserialize(this.xywh).isIntersectWithBound(bound);
  }
}
