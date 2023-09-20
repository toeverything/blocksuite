import type { PointerEventState } from '@blocksuite/block-std';

import type { Renderer } from '../../../surface-block/renderer.js';

export type MoveDelta = {
  x: number;
  y: number;
};

export function calPanDelta(
  viewport: Renderer,
  e: PointerEventState,
  edgeDistance = 20
): MoveDelta | null {
  // Get viewport edge
  const { left, top, width, height } = viewport;
  // Get pointer position
  const { x, y } = e;
  // Check if pointer is near viewport edge
  const nearLeft = x < left + edgeDistance;
  const nearRight = x > left + width - edgeDistance;
  const nearTop = y < top + edgeDistance;
  const nearBottom = y > top + height - edgeDistance;
  // If pointer is not near viewport edge, return false
  if (!(nearLeft || nearRight || nearTop || nearBottom)) return null;

  // Calculate move delta
  const delta: MoveDelta = {
    x: 0,
    y: 0,
  };

  if (nearLeft) {
    delta.x = x - (left + edgeDistance);
  } else if (nearRight) {
    delta.x = x - (left + width - edgeDistance);
  }

  if (nearTop) {
    delta.y = y - (top + edgeDistance);
  } else if (nearBottom) {
    delta.y = y - (top + height - edgeDistance);
  }

  return delta;
}
