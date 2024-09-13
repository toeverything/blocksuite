import {
  type GfxBlockElementModel,
  type GfxContainerElement,
  gfxContainerSymbol,
  type GfxElementGeometry,
  type GfxModel,
  type PointTestOptions,
  SurfaceBlockModel,
} from '@blocksuite/block-std/gfx';
import { Bound, type SerializedXYWH } from '@blocksuite/global/utils';
import { BlockModel, defineBlockSchema, type Text } from '@blocksuite/store';

import type { Color } from '../../consts/index.js';

import { GfxCompatible } from '../../utils/index.js';

export type FrameBlockProps = {
  title: Text;
  background: Color;
  xywh: SerializedXYWH;
  index: string;
  childElementIds?: Record<string, boolean>;
};

export const FrameBlockSchema = defineBlockSchema({
  flavour: 'affine:frame',
  props: (internal): FrameBlockProps => ({
    title: internal.Text(),
    background: '--affine-palette-transparent',
    xywh: `[0,0,100,100]`,
    index: 'a0',
    childElementIds: Object.create(null),
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

export class FrameBlockModel
  extends GfxCompatible<FrameBlockProps>(BlockModel)
  implements GfxElementGeometry, GfxContainerElement
{
  [gfxContainerSymbol] = true as const;

  get childElements() {
    const surface = this.doc
      .getBlocks()
      .find(model => model instanceof SurfaceBlockModel);
    if (!surface) return [];

    const elements: BlockSuite.EdgelessModel[] = [];

    for (const key of this.childIds) {
      const element =
        surface.getElementById(key) ||
        (surface.doc.getBlockById(key) as GfxBlockElementModel);

      element && elements.push(element);
    }

    return elements;
  }

  get childIds() {
    return [...(this.childElementIds ? Object.keys(this.childElementIds) : [])];
  }

  addChild(element: BlockSuite.EdgelessModel | string): void {
    const id = typeof element === 'string' ? element : element.id;
    this.doc.transact(() => {
      this.childElementIds = { ...this.childElementIds, [id]: true };
    });
  }

  addChildren(elements: (BlockSuite.EdgelessModel | string)[]): void {
    elements = [...new Set(elements)];

    const newChildren: Record<string, boolean> = {};
    for (const element of elements) {
      const id = typeof element === 'string' ? element : element.id;
      newChildren[id] = true;
    }

    this.doc.transact(() => {
      this.childElementIds = {
        ...this.childElementIds,
        ...newChildren,
      };
    });
  }

  override containsBound(bound: Bound): boolean {
    return this.elementBound.contains(bound);
  }

  hasDescendant(element: string | GfxModel): boolean {
    const id = typeof element === 'string' ? element : element.id;
    return !!this.childElementIds?.[id];
  }

  override includesPoint(x: number, y: number, _: PointTestOptions): boolean {
    const bound = Bound.deserialize(this.xywh);
    return bound.isPointInBound([x, y]);
  }

  override intersectsBound(selectedBound: Bound): boolean {
    const bound = Bound.deserialize(this.xywh);
    return (
      bound.isIntersectWithBound(selectedBound) || selectedBound.contains(bound)
    );
  }

  removeChild(element: BlockSuite.EdgelessModel | string): void {
    const id = typeof element === 'string' ? element : element.id;
    this.doc.transact(() => {
      this.childElementIds && delete this.childElementIds[id];
    });
  }
}

declare global {
  namespace BlockSuite {
    interface EdgelessBlockModelMap {
      'affine:frame': FrameBlockModel;
    }
    interface BlockModels {
      'affine:frame': FrameBlockModel;
    }
  }
}
