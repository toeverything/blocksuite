import { ConnectorElementModel } from '@blocksuite/affine-model';
import {
  type GfxContainerElement,
  type GfxModel,
  isGfxContainerElm,
} from '@blocksuite/block-std/gfx';
import { Bound } from '@blocksuite/global/utils';

import { LayoutableMindmapElementModel } from './mindmap/utils.js';

function updatChildElementsXYWH(
  container: GfxContainerElement,
  targetBound: Bound,
  updateElement: (id: string, props: Record<string, unknown>) => void
) {
  const containerBound = Bound.deserialize(container.xywh);
  const scaleX = targetBound.w / containerBound.w;
  const scaleY = targetBound.h / containerBound.h;
  container.childElements.forEach(child => {
    const childBound = Bound.deserialize(child.xywh);
    childBound.x = targetBound.x + scaleX * (childBound.x - containerBound.x);
    childBound.y = targetBound.y + scaleY * (childBound.y - containerBound.y);
    childBound.w = scaleX * childBound.w;
    childBound.h = scaleY * childBound.h;
    updateXYWH(child, childBound, updateElement);
  });
}

export function updateXYWH(
  ele: GfxModel,
  bound: Bound,
  updateElement: (id: string, props: Record<string, unknown>) => void
) {
  if (ele instanceof ConnectorElementModel) {
    ele.moveTo(bound);
  } else if (ele instanceof LayoutableMindmapElementModel) {
    const rootId = ele.tree.id;
    const rootEle = ele.childElements.find(child => child.id === rootId);
    if (rootEle) {
      const rootBound = Bound.deserialize(rootEle.xywh);
      rootBound.x += bound.x - ele.x;
      rootBound.y += bound.y - ele.y;
      updateXYWH(rootEle, rootBound, updateElement);
    }
    ele.layout();
  } else if (isGfxContainerElm(ele)) {
    updatChildElementsXYWH(ele, bound, updateElement);
    updateElement(ele.id, {
      xywh: bound.serialize(),
    });
  } else {
    updateElement(ele.id, {
      xywh: bound.serialize(),
    });
  }
}
