import type {
  Collision,
  CollisionDetection,
  Coordinates,
  DndClientRect,
  DroppableContainer,
} from '../types.js';

import { distanceBetween } from './distance-between-points.js';

interface CollisionDescriptor extends Collision {
  data: {
    droppableContainer: DroppableContainer;
    value: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export function sortCollisionsAsc(
  { data: { value: a } }: CollisionDescriptor,
  { data: { value: b } }: CollisionDescriptor
) {
  return a - b;
}

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
  const centerRect = centerOfRectangle(
    collisionRect,
    collisionRect.left,
    collisionRect.top
  );
  const collisions: CollisionDescriptor[] = [];

  for (const droppableContainer of droppableContainers) {
    const { id } = droppableContainer;
    const rect = droppableRects.get(id);

    if (rect) {
      const distBetween = distanceBetween(centerOfRectangle(rect), centerRect);

      collisions.push({ id, data: { droppableContainer, value: distBetween } });
    }
  }
  return collisions.sort(sortCollisionsAsc);
};
