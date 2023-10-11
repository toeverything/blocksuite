import type { HoverMiddleware } from './types.js';

export type SafeTriangleOptions = {
  zIndex: number;
  buffer: number;
  /**
   * abort triangle guard if the mouse not move for some time
   */
  idleTimeout: number;
  debug?: boolean;
};

/**
 * Returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
 *
 * See https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
 */
function hasIntersection(
  { x: a, y: b }: { x: number; y: number },
  { x: c, y: d }: { x: number; y: number },
  { x: p, y: q }: { x: number; y: number },
  { x: r, y: s }: { x: number; y: number }
) {
  const det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  } else {
    const lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    const gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1;
  }
}

const getNearestSide = (
  point: { x: number; y: number },
  rect: DOMRect
):
  | [
      'top' | 'bottom' | 'left' | 'right',
      { x: number; y: number },
      { x: number; y: number },
    ]
  | null => {
  const centerPoint = {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
  const topLeft = { x: rect.x, y: rect.y };
  const topRight = { x: rect.right, y: rect.y };
  const bottomLeft = { x: rect.x, y: rect.bottom };
  const bottomRight = { x: rect.right, y: rect.bottom };
  if (hasIntersection(point, centerPoint, bottomLeft, bottomRight)) {
    return ['top', bottomLeft, bottomRight];
  }
  if (hasIntersection(point, centerPoint, topLeft, topRight)) {
    return ['bottom', topLeft, topRight];
  }
  if (hasIntersection(point, centerPoint, topLeft, bottomLeft)) {
    return ['right', topLeft, bottomLeft];
  }
  if (hasIntersection(point, centerPoint, topRight, bottomRight)) {
    return ['left', topRight, bottomRight];
  }
  return null;
};

/**
 * Part of the code is ported from https://github.com/floating-ui/floating-ui/blob/master/packages/react/src/safePolygon.ts
 * Licensed under MIT.
 */
export const safeTriangle = ({
  zIndex = 10000,
  buffer = 2,
  idleTimeout = 40,
  debug = false,
}: Partial<SafeTriangleOptions> = {}): HoverMiddleware => {
  let abortController = new AbortController();
  return async ({ event, referenceElement, floatingElement }) => {
    abortController.abort();
    const newAbortController = new AbortController();
    abortController = newAbortController;

    const isLeave = event.type === 'mouseleave';
    if (!isLeave || event.target !== referenceElement) return true;
    if (!(event instanceof MouseEvent)) {
      console.warn('Unknown event type in hover middleware', event);
      return true;
    }
    if (!floatingElement) return true;

    const mouseX = event.x;
    const mouseY = event.y;
    const refRect = referenceElement.getBoundingClientRect();
    const rect = floatingElement.getBoundingClientRect();

    // If the mouse leaves from inside the referenceElement element,
    // we should ignore the event.
    const leaveFromInside =
      mouseX > refRect.x &&
      mouseY > refRect.y &&
      mouseX < refRect.x + refRect.width &&
      mouseY < refRect.y + refRect.height;
    if (leaveFromInside) return true;

    // what side is the floating element on
    const floatingData = getNearestSide({ x: mouseX, y: mouseY }, rect);
    if (!floatingData) return true;
    const floatingSide = floatingData[0];
    // If the pointer is leaving from the opposite side, no need to show the triangle.
    // A constant of 1 handles floating point rounding errors.
    if (
      (floatingSide === 'top' && mouseY >= refRect.bottom - 1) ||
      (floatingSide === 'bottom' && mouseY <= refRect.top + 1) ||
      (floatingSide === 'left' && mouseX >= refRect.right - 1) ||
      (floatingSide === 'right' && mouseX <= refRect.left + 1)
    ) {
      return true;
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const updateSafeTriangle = (mouseX: number, mouseY: number) => {
      if (newAbortController.signal.aborted) return;
      // If the mouse is inside the floating element, we should ignore the event.
      if (
        mouseX >= rect.left &&
        mouseX <= rect.right &&
        mouseY >= rect.top &&
        mouseY <= rect.bottom
      )
        newAbortController.abort();
      const p1 = { x: mouseX, y: mouseY };
      // Assume the floating element is still in the same position.
      const p2 = floatingData[1];
      const p3 = floatingData[2];
      // The base point is the top left corner of the three points.
      const basePoint = {
        x: Math.min(p1.x, p2.x, p3.x) - buffer,
        y: Math.min(p1.y, p2.y, p3.y) - buffer,
      };
      const areaHeight = Math.max(
        Math.abs(p1.y - p2.y),
        Math.abs(p1.y - p3.y),
        Math.abs(p2.y - p3.y)
      );
      const areaWidth = Math.max(
        Math.abs(p1.x - p2.x),
        Math.abs(p1.x - p3.x),
        Math.abs(p2.x - p3.x)
      );
      Object.assign(svg.style, {
        position: 'fixed',
        pointerEvents: 'none',
        width: areaWidth + buffer * 2,
        height: areaHeight + buffer * 2,
        zIndex,
        top: 0,
        left: 0,
        transform: `translate(${basePoint.x}px, ${basePoint.y}px)`,
      });
      path.setAttributeNS(
        null,
        'd',
        `M${p1.x - basePoint.x} ${p1.y - basePoint.y} ${p2.x - basePoint.x} ${
          p2.y - basePoint.y
        } ${p3.x - basePoint.x} ${p3.y - basePoint.y} z`
      );
    };
    path.setAttributeNS(null, 'pointer-events', 'auto');
    path.setAttributeNS(null, 'fill', 'transparent');
    path.setAttributeNS(null, 'stroke-width', buffer.toString());
    path.setAttributeNS(null, 'stroke', 'transparent');
    if (debug) {
      path.setAttributeNS(null, 'stroke', 'red');
    }
    updateSafeTriangle(mouseX, mouseY);
    svg.append(path);
    document.body.append(svg);
    abortController.signal.addEventListener('abort', () => svg.remove());
    let idleId = 0;
    idleId = window.setTimeout(() => newAbortController.abort(), idleTimeout);
    let frameId = 0;
    svg.addEventListener(
      'mousemove',
      e => {
        clearTimeout(idleId);
        idleId = window.setTimeout(
          () => newAbortController.abort(),
          idleTimeout
        );
        cancelAnimationFrame(frameId);
        // prevent unexpected mouseleave
        frameId = requestAnimationFrame(() =>
          updateSafeTriangle(e.clientX, e.clientY)
        );
      },
      { signal: newAbortController.signal }
    );

    await new Promise<void>(res => {
      if (newAbortController.signal.aborted) res();
      newAbortController.signal.addEventListener('abort', () => res());
      svg.addEventListener('mouseleave', () => newAbortController.abort(), {
        signal: newAbortController.signal,
      });
    });

    return true;
  };
};
