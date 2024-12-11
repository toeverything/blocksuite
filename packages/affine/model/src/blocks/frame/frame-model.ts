import type {
  GfxBlockElementModel,
  GfxCompatibleProps,
  GfxElementGeometry,
  GfxGroupCompatibleInterface,
  GfxModel,
  PointTestOptions,
} from '@blocksuite/block-std/gfx';

import {
  canSafeAddToContainer,
  descendantElementsImpl,
  generateKeyBetweenV2,
  GfxCompatible,
  gfxGroupCompatibleSymbol,
  hasDescendantElementImpl,
} from '@blocksuite/block-std/gfx';
import { Bound } from '@blocksuite/global/utils';
import { BlockModel, defineBlockSchema, type Text } from '@blocksuite/store';

import type { Color } from '../../consts/index.js';

export type FrameBlockProps = {
  title: Text;
  background: Color;
  childElementIds?: Record<string, boolean>;
  presentationIndex?: string;
} & GfxCompatibleProps;

export const FrameBlockSchema = defineBlockSchema({
  flavour: 'affine:frame',
  props: (internal): FrameBlockProps => ({
    title: internal.Text(),
    background: '--affine-palette-transparent',
    xywh: `[0,0,100,100]`,
    index: 'a0',
    childElementIds: Object.create(null),
    presentationIndex: generateKeyBetweenV2(null, null),
    lockedBySelf: false,
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
  implements GfxElementGeometry, GfxGroupCompatibleInterface
{
  [gfxGroupCompatibleSymbol] = true as const;

  get childElements() {
    if (!this.surface) return [];

    const elements: GfxModel[] = [];

    for (const key of this.childIds) {
      const element =
        this.surface.getElementById(key) ||
        (this.surface.doc.getBlockById(key) as GfxBlockElementModel);

      element && elements.push(element);
    }

    return elements;
  }

  get childIds() {
    return [...(this.childElementIds ? Object.keys(this.childElementIds) : [])];
  }

  get descendantElements(): GfxModel[] {
    return descendantElementsImpl(this);
  }

  addChild(element: GfxModel) {
    if (!canSafeAddToContainer(this, element)) return;

    this.doc.transact(() => {
      this.childElementIds = { ...this.childElementIds, [element.id]: true };
    });
  }

  addChildren(elements: GfxModel[]): void {
    elements = [...new Set(elements)].filter(element =>
      canSafeAddToContainer(this, element)
    );

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

  hasChild(element: GfxModel): boolean {
    return this.childElementIds ? element.id in this.childElementIds : false;
  }

  hasDescendant(element: GfxModel): boolean {
    return hasDescendantElementImpl(this, element);
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

  removeChild(element: GfxModel): void {
    this.doc.transact(() => {
      this.childElementIds && delete this.childElementIds[element.id];
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
