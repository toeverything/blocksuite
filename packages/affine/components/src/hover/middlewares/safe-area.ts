import type { HoverMiddleware } from '../types.js';

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

function isInside(
  { x, y }: { x: number; y: number },
  rect: DOMRect,
  buffer = 0
) {
  return (
    x >= rect.left - buffer &&
    x <= rect.right + buffer &&
    y >= rect.top - buffer &&
    y <= rect.bottom - buffer
  );
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
    const leaveFromInside = isInside({ x: mouseX, y: mouseY }, refRect);
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
    let frameId = 0;
    let idleId = window.setTimeout(
      () => newAbortController.abort(),
      idleTimeout
    );
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

export type SafeBridgeOptions = { debug: boolean; idleTimeout: number };

/**
 * Create a virtual rectangular bridge between the reference element and the floating element.
 *
 * Part of the code is ported from https://github.com/floating-ui/floating-ui/blob/master/packages/react/src/safePolygon.ts
 * Licensed under MIT.
 */
export const safeBridge = ({
  debug = false,
  idleTimeout = 500,
}: Partial<SafeBridgeOptions> = {}): HoverMiddleware => {
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
    const checkInside = (mouseX: number, mouseY: number) => {
      if (newAbortController.signal.aborted) return false;
      const point = { x: mouseX, y: mouseY };
      const refRect = referenceElement.getBoundingClientRect();
      const rect = floatingElement.getBoundingClientRect();
      // what side is the floating element on
      const floatingData = getNearestSide(point, rect);
      if (!floatingData) return false;
      const floatingSide = floatingData[0];
      // If the pointer is leaving from the other side, no need to show the bridge.
      // A constant of 1 handles floating point rounding errors.
      if (
        (floatingSide === 'top' && mouseY > refRect.top + 1) ||
        (floatingSide === 'bottom' && mouseY < refRect.bottom - 1) ||
        (floatingSide === 'left' && mouseX > refRect.left + 1) ||
        (floatingSide === 'right' && mouseX < refRect.right - 1)
      )
        return false;
      let rectRect: DOMRect;
      switch (floatingSide) {
        case 'top': {
          rectRect = new DOMRect(
            Math.max(rect.left, refRect.left),
            rect.bottom,
            Math.min(rect.right, refRect.right) -
              Math.max(rect.left, refRect.left),
            refRect.top - rect.bottom
          );
          break;
        }
        case 'bottom': {
          rectRect = new DOMRect(
            Math.max(rect.left, refRect.left),
            refRect.bottom,
            Math.min(rect.right, refRect.right) -
              Math.max(rect.left, refRect.left),
            rect.top - refRect.bottom
          );
          break;
        }
        case 'left': {
          rectRect = new DOMRect(
            rect.right,
            Math.max(rect.top, refRect.top),
            refRect.left - rect.right,
            Math.min(rect.bottom, refRect.bottom) -
              Math.max(rect.top, refRect.top)
          );
          break;
        }
        case 'right': {
          rectRect = new DOMRect(
            refRect.right,
            Math.max(rect.top, refRect.top),
            rect.left - refRect.right,
            Math.min(rect.bottom, refRect.bottom) -
              Math.max(rect.top, refRect.top)
          );
          break;
        }
        default:
          return false;
      }

      const inside = isInside(point, rectRect, 1);
      if (inside && debug) {
        const debugId = 'debug-rectangle-bridge-rect';
        const rectDom =
          document.querySelector<HTMLDivElement>(`#${debugId}`) ??
          document.createElement('div');
        rectDom.id = debugId;
        Object.assign(rectDom.style, {
          position: 'fixed',
          pointerEvents: 'none',
          background: 'aqua',
          opacity: '0.3',
          top: rectRect.top + 'px',
          left: rectRect.left + 'px',
          width: rectRect.width + 'px',
          height: rectRect.height + 'px',
        });
        document.body.append(rectDom);
        newAbortController.signal.addEventListener('abort', () =>
          rectDom.remove()
        );
      }
      return inside;
    };
    if (!checkInside(event.x, event.y)) return true;
    await new Promise<void>(res => {
      if (newAbortController.signal.aborted) res();
      newAbortController.signal.addEventListener('abort', () => res());
      let idleId = window.setTimeout(
        () => newAbortController.abort(),
        idleTimeout
      );
      document.addEventListener(
        'mousemove',
        e => {
          clearTimeout(idleId);
          idleId = window.setTimeout(
            () => newAbortController.abort(),
            idleTimeout
          );
          if (!checkInside(e.clientX, e.clientY)) newAbortController.abort();
        },
        {
          signal: newAbortController.signal,
        }
      );
    });
    return true;
  };
};
