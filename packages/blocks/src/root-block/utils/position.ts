import { clamp } from '../../_common/utils/math.js';

type CollisionBox = {
  /**
   * The boundary rect of the container that the obj is in.
   */
  boundaryRect?: DOMRect;
  edgeGap?: number;
  /**
   * The boundary rect of the obj that is being positioned.
   */
  objRect?: { height: number; width: number };
  offsetX?: number;
  offsetY?: number;
  /**
   * The point that the objRect is positioned to.
   */
  positioningPoint: { x: number; y: number };
};

export function calcSafeCoordinate({
  boundaryRect = document.body.getBoundingClientRect(),
  edgeGap = 20,
  objRect = { height: 0, width: 0 },
  offsetX = 0,
  offsetY = 0,
  positioningPoint,
}: CollisionBox) {
  const safeX = clamp(
    positioningPoint.x + offsetX,
    edgeGap,
    boundaryRect.width - objRect.width - edgeGap
  );
  const y = positioningPoint.y + offsetY;
  // Not use clamp for y coordinate to avoid the quick bar always showing after scrolling
  // const safeY = clamp(
  //   positioningPoint.y + offsetY,
  //   edgeGap,
  //   boundaryRect.height - objRect.height - edgeGap
  // );
  return {
    x: safeX,
    y,
  };
}

/**
 * Used to compare the space available
 * at the top and bottom of an element within a container.
 *
 * Please give preference to {@link getPopperPosition}
 */
export function compareTopAndBottomSpace(
  obj: { getBoundingClientRect: () => DOMRect },
  container = document.body,
  gap = 20
) {
  const objRect = obj.getBoundingClientRect();
  const spaceRect = container.getBoundingClientRect();
  const topSpace = objRect.top - spaceRect.top;
  const bottomSpace = spaceRect.bottom - objRect.bottom;
  const topOrBottom: 'bottom' | 'top' =
    topSpace > bottomSpace ? 'top' : 'bottom';
  return {
    // the height is the available space.
    height: (topOrBottom === 'top' ? topSpace : bottomSpace) - gap,
    placement: topOrBottom,
  };
}

/**
 * Get the position of the popper element with flip.
 */
export function getPopperPosition(
  popper: {
    getBoundingClientRect: () => DOMRect;
  },
  reference: {
    getBoundingClientRect: () => DOMRect;
  },
  { gap = 12, offsetY = 5 }: { gap?: number; offsetY?: number } = {}
) {
  if (!popper) {
    // foolproof, someone may use element with non-null assertion
    console.warn(
      'The popper element is not exist. Popper position maybe incorrect'
    );
  }
  const { height, placement } = compareTopAndBottomSpace(
    reference,
    document.body,
    gap + offsetY
  );

  const referenceRect = reference.getBoundingClientRect();
  const positioningPoint = {
    x: referenceRect.x,
    y: referenceRect.y + (placement === 'bottom' ? referenceRect.height : 0),
  };

  // TODO maybe use the editor container as the boundary rect to avoid the format bar being covered by other elements
  const boundaryRect = document.body.getBoundingClientRect();
  // Note: the popperRect.height maybe incorrect
  // because we are calculated its correct height
  const popperRect = popper?.getBoundingClientRect();

  const safeCoordinate = calcSafeCoordinate({
    boundaryRect,
    objRect: popperRect,
    offsetY: placement === 'bottom' ? offsetY : -offsetY,
    positioningPoint,
  });

  return {
    /**
     * The height is the available space height.
     *
     * Note: it's a max height, not the real height,
     * because sometimes the popper's height is smaller than the available space.
     */
    height,
    placement,
    x: `${safeCoordinate.x}px`,
    y:
      placement === 'bottom'
        ? `${safeCoordinate.y}px`
        : // We need to use `calc(-100%)` since the height of popper maybe incorrect
          `calc(${safeCoordinate.y}px - 100%)`,
  };
}
