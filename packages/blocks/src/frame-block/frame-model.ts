import {
  type MigrationRunner,
  NativeWrapper,
  type Text,
} from '@blocksuite/store';
import { BaseBlockModel, defineBlockSchema } from '@blocksuite/store';

import { BLOCK_ID_ATTR } from '../__internal__/consts.js';
import type { SurfaceBlockComponent } from '../index.js';
import type {
  EdgelessElementUtils,
  HitTestOptions,
} from '../surface-block/elements/edgeless-element.js';
import {
  Bound,
  deserializeXYWH,
  type IVec,
  linePolygonIntersects,
  type PointLocation,
  type XYWH,
} from '../surface-block/index.js';
import type { FrameBlockComponent } from './frame-block.js';

const migration = {
  toV2: data => {
    const { xywh } = data;

    if (typeof xywh === 'string') {
      data.xywh = new NativeWrapper(deserializeXYWH(xywh));
    }
  },
} satisfies Record<string, MigrationRunner<typeof FrameBlockSchema>>;

export const FrameBlockSchema = defineBlockSchema({
  flavour: 'affine:frame',
  props: internal =>
    ({
      title: internal.Text(),
      background: '--affine-palette-transparent',
      xywh: new NativeWrapper([0, 0, 100, 100]),
      index: 'a0',
    }) as {
      title: Text;
      background: string;
      xywh: NativeWrapper<XYWH>;
      index: string;
    },
  metadata: {
    version: 2,
    role: 'content',
    parent: ['affine:surface'],
    children: [],
  },
  onUpgrade: (data, oldVersion, version) => {
    if (oldVersion < 2 && version >= 2) {
      migration.toV2(data);
    }
  },
  toModel: () => {
    return new FrameBlockModel();
  },
});

type Props = {
  title: Text;
  background: string;
  xywh: NativeWrapper<XYWH>;
  index: string;
};

export class FrameBlockModel
  extends BaseBlockModel<Props>
  implements EdgelessElementUtils
{
  get connectable() {
    return false;
  }

  containedByBounds(bound: Bound): boolean {
    return bound.contains(Bound.fromXYWH(this.xywh.getValue()));
  }
  getNearestPoint(_: IVec): IVec {
    throw new Error('Function not implemented.');
  }
  intersectWithLine(start: IVec, end: IVec): PointLocation[] | null {
    return linePolygonIntersects(
      start,
      end,
      Bound.fromXYWH(this.xywh.getValue()).points
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
    return Bound.fromXYWH(this.xywh.getValue()).isIntersectWithBound(bound);
  }
}
