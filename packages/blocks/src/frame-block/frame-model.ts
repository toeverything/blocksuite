import type { Text } from '@blocksuite/store';

import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import type { IHitTestOptions } from '../surface-block/element-model/base.js';
import type { SerializedXYWH } from '../surface-block/utils/xywh.js';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import { Bound } from '../surface-block/utils/bound.js';

type FrameBlockProps = {
  background: string;
  index: string;
  title: Text;
  xywh: SerializedXYWH;
};

export const FrameBlockSchema = defineBlockSchema({
  flavour: 'affine:frame',
  metadata: {
    children: [],
    parent: ['affine:surface'],
    role: 'content',
    version: 1,
  },
  props: (internal): FrameBlockProps => ({
    background: '--affine-palette-transparent',
    index: 'a0',
    title: internal.Text(),
    xywh: `[0,0,100,100]`,
  }),
  toModel: () => {
    return new FrameBlockModel();
  },
});

export class FrameBlockModel extends selectable<FrameBlockProps>(BlockModel) {
  static PADDING = [8, 10];

  override boxSelect(selectedBound: Bound): boolean {
    const bound = Bound.deserialize(this.xywh);
    return (
      bound.isIntersectWithBound(selectedBound) || selectedBound.contains(bound)
    );
  }

  override hitTest(x: number, y: number, _: IHitTestOptions): boolean {
    const bound = Bound.deserialize(this.xywh);
    const hit = bound.isPointNearBound([x, y], 5);

    if (hit) return true;

    return this.externalBound?.isPointInBound([x, y]) ?? false;
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:frame': FrameBlockModel;
    }
  }
}
