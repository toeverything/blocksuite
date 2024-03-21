import type { EditorHost } from '@blocksuite/block-std';
import type { Text } from '@blocksuite/store';
import { BlockModel, defineBlockSchema } from '@blocksuite/store';

import { selectable } from '../_common/edgeless/mixin/edgeless-selectable.js';
import type { HitTestOptions } from '../root-block/edgeless/type.js';
import type { EdgelessRootService } from '../root-block/index.js';
import { getTextRect } from '../surface-block/elements/text/utils.js';
import { Bound, type SerializedXYWH } from '../surface-block/index.js';

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

export class FrameBlockModel extends selectable<FrameBlockProps>(BlockModel) {
  static PADDING = [8, 10];

  override hitTest(
    x: number,
    y: number,
    _: HitTestOptions,
    host: EditorHost
  ): boolean {
    const bound = Bound.deserialize(this.xywh);
    const hit = bound.isPointNearBound([x, y], 5);
    const zoom = _.zoom ?? 1;

    if (hit) return true;

    const rootService =
      host.std.spec.getService<EdgelessRootService>('affine:page');
    const isInner = rootService.frame.getFrameInner(this);

    const titleRect = getTextRect(this.title.toString(), 'Inter', 14);

    titleRect.w = (titleRect.w + FrameBlockModel.PADDING[1] * 2) / zoom;
    titleRect.h = (titleRect.h + FrameBlockModel.PADDING[0] * 2) / zoom;

    bound.y = isInner ? bound.y : bound.y - titleRect.h;
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
