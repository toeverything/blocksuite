import type { PointerEventState } from '@blocksuite/block-std';

import type { IVec } from '../../../surface-block/index.js';
import type { Renderer } from '../../../surface-block/renderer.js';

const PANNING_DISTANCE = 30;

export function calPanDelta(
  viewport: Renderer,
  e: PointerEventState,
  edgeDistance = 20
): IVec | null {
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
  let deltaX = 0;
  let deltaY = 0;

  // Use PANNING_DISTANCE to limit the max delta, avoid panning too fast
  if (nearLeft) {
    deltaX = Math.max(-PANNING_DISTANCE, x - (left + edgeDistance));
  } else if (nearRight) {
    deltaX = Math.min(PANNING_DISTANCE, x - (left + width - edgeDistance));
  }

  if (nearTop) {
    deltaY = Math.max(-PANNING_DISTANCE, y - (top + edgeDistance));
  } else if (nearBottom) {
    deltaY = Math.min(PANNING_DISTANCE, y - (top + height - edgeDistance));
  }

  return [deltaX, deltaY];
}
