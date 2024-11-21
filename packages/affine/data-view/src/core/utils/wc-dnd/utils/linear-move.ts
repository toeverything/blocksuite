import type {
  CollisionDetection,
  Coordinates,
  DndClientRect,
} from '../types.js';

const centerOfRectangle = (
  rect: DndClientRect,
  left = rect.left,
  top = rect.top
): Coordinates => ({
  x: left + rect.width * 0.5,
  y: top + rect.height * 0.5,
});
type Target = {
  id: string;
  value: number;
};
export const linearMove =
  (horizontal: boolean): CollisionDetection =>
  ({ active, collisionRect, droppableRects, droppableContainers }) => {
    let target: Target | undefined;
    const activeCenter = centerOfRectangle(active.rect);
    for (const droppableContainer of droppableContainers) {
      const { id } = droppableContainer;
      const rect = droppableRects.get(id);
      const center = rect && centerOfRectangle(rect);
      if (!center || id === active?.id) {
        continue;
      }
      if (horizontal) {
        if (center.x < activeCenter.x && collisionRect.left < center.x) {
          const diff = center.x - collisionRect.left;
          if (!target || diff < target.value) {
            target = { id, value: diff };
          }
        }
        if (center.x > activeCenter.x && collisionRect.right > center.x) {
          const diff = collisionRect.right - center.x;
          if (!target || diff < target.value) {
            target = { id, value: diff };
          }
        }
      } else {
        if (center.y < activeCenter.y && collisionRect.top < center.y) {
          const diff = center.y - collisionRect.top;
          if (!target || diff < target.value) {
            target = { id, value: diff };
          }
        }
        if (center.y > activeCenter.y && collisionRect.bottom > center.y) {
          const diff = collisionRect.bottom - center.y;
          if (!target || diff < target.value) {
            target = { id, value: diff };
          }
        }
      }
    }
    return target ? [target] : [];
  };
