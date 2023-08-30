import {
  type BlockComponentElement,
  type Point,
} from '../../../../__internal__/index.js';

/**
 * Find the most close block on the given position
 * @param container container which the blocks can be found inside
 * @param point position
 */
export function findClosestBlock(
  container: BlockComponentElement,
  point: Point
) {
  const children = Array.from(
    container.querySelectorAll(
      '.affine-note-block-container > .affine-block-children-container > [data-block-id]'
    )
  );
  let lastDistance = Number.POSITIVE_INFINITY;
  let lastChild = null;

  if (!children.length) return null;

  for (const child of children) {
    const rect = child.getBoundingClientRect();
    const distance = Math.abs(rect.y + rect.height / 2 - point.y);

    if (distance <= lastDistance) {
      lastDistance = distance;
      lastChild = child;
    } else {
      return lastChild;
    }
  }

  return lastChild;
}
