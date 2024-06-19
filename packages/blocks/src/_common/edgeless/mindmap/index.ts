import type { Viewport } from '../../../root-block/edgeless/utils/viewport.js';
import { MindmapElementModel } from '../../../surface-block/index.js';

export function isMindmapNode(el: BlockSuite.EdgelessModelType) {
  return (
    el.group instanceof MindmapElementModel || el instanceof MindmapElementModel
  );
}

export function isSelectSingleMindMap(els: BlockSuite.EdgelessModelType[]) {
  return els.length === 1 && els[0].group instanceof MindmapElementModel;
}

export function isElementOutsideViewport(
  viewport: Viewport,
  element: BlockSuite.EdgelessModelType,
  padding: [number, number] = [0, 0]
) {
  const elementBound = element.elementBound;

  padding[0] /= viewport.zoom;
  padding[1] /= viewport.zoom;

  elementBound.x -= padding[1];
  elementBound.w += padding[1];
  elementBound.y -= padding[0];
  elementBound.h += padding[0];

  return !viewport.viewportBounds.contains(elementBound);
}

export function getNearestTranslation(
  viewport: Viewport,
  element: BlockSuite.EdgelessModelType,
  padding: [number, number] = [0, 0]
) {
  const viewportBound = viewport.viewportBounds;
  const elementBound = element.elementBound;
  let dx = 0;
  let dy = 0;

  if (elementBound.x - padding[1] < viewportBound.x) {
    dx = viewportBound.x - (elementBound.x - padding[1]);
  } else if (
    elementBound.x + elementBound.w + padding[1] >
    viewportBound.x + viewportBound.w
  ) {
    dx =
      viewportBound.x +
      viewportBound.w -
      (elementBound.x + elementBound.w + padding[1]);
  }

  if (elementBound.y - padding[0] < viewportBound.y) {
    dy = elementBound.y - padding[0] - viewportBound.y;
  } else if (
    elementBound.y + elementBound.h + padding[0] >
    viewportBound.y + viewportBound.h
  ) {
    dy =
      elementBound.y +
      elementBound.h +
      padding[0] -
      (viewportBound.y + viewportBound.h);
  }

  return [dx, dy];
}
