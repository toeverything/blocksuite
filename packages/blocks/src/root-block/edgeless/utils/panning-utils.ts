import type { PointerEventState } from '@blocksuite/block-std';
import type { IVec } from '@blocksuite/global/utils';

import type { Viewport } from './viewport.js';

const PANNING_DISTANCE = 30;

export function calPanDelta(
  viewport: Viewport,
  e: PointerEventState,
  edgeDistance = 20
): IVec | null {
  // Get viewport edge
  const { left, top, cumulativeParentScale } = viewport;
  let { width, height } = viewport;
  width /= cumulativeParentScale;
  height /= cumulativeParentScale;
  // Get pointer position
  let { x, y } = e;
  const { containerOffset } = e;
  x += containerOffset.x;
  y += containerOffset.y;
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
