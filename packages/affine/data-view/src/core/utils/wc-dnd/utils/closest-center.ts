import type {
  CollisionDetection,
  Coordinates,
  DndClientRect,
} from '../types.js';
import { distanceBetween } from './distance-between-points.js';

/**
 * Returns the coordinates of the center of a given ClientRect
 */
const centerOfRectangle = (
  rect: DndClientRect,
  left = rect.left,
  top = rect.top
): Coordinates => ({
  x: left + rect.width * 0.5,
  y: top + rect.height * 0.5,
});

/**
 * Returns the closest rectangles from an array of rectangles to the center of a given
 * rectangle.
 */
export const closestCenter: CollisionDetection = ({
  collisionRect,
  droppableRects,
  droppableContainers,
}) => {
  let closest: { id: string; value: number } | undefined;
  const centerRect = centerOfRectangle(collisionRect);

  for (const droppableContainer of droppableContainers) {
    const { id } = droppableContainer;
    const rect = droppableRects.get(id);

    if (rect) {
      const distBetween = distanceBetween(centerOfRectangle(rect), centerRect);
      if (!closest || distBetween < closest.value) {
        closest = { id, value: distBetween };
      }
    }
  }
  return closest ? [closest] : [];
};
