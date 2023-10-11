import { sleep } from './function.js';

export type WhenHoverOptions = {
  leaveDelay?: number;
  /**
   * When already hovered to the reference element,
   * but the floating element is not ready,
   * the callback will still be executed if the `alwayRunWhenNoFloating` is true.
   *
   * It is useful when the floating element is removed just before by a user's action,
   * and the user's mouse is still hovering over the reference element.
   *
   * @default true
   */
  alwayRunWhenNoFloating?: boolean;
  safeArea?: boolean | SafeTriangleOptions;
};

type HoverMiddleware = (ctx: {
  event: Event;
  referenceElement?: Element;
  floatingElement?: Element;
}) => boolean | Promise<boolean>;

const dedupe = (keepWhenFloatingNotReady = true): HoverMiddleware => {
  const SKIP = false;
  const KEEP = true;
  let hoverState = false;
  return ({ event, floatingElement }) => {
    const curState = hoverState;
    if (event.type === 'mouseover') {
      // hover in
      hoverState = true;
      if (curState !== hoverState)
        // state changed, so we should keep the event
        return KEEP;
      if (
        keepWhenFloatingNotReady &&
        (!floatingElement || !floatingElement.isConnected)
      ) {
        // Already hovered
        // But the floating element is not ready
        // so we should not skip the event
        return KEEP;
      }
      return SKIP;
    }
    if (event.type === 'mouseleave') {
      // hover out
      hoverState = false;
      if (curState !== hoverState) return KEEP;
      if (keepWhenFloatingNotReady && floatingElement?.isConnected) {
        // Already hover out
        // But the floating element is still showing
        // so we should not skip the event
        return KEEP;
      }
      return SKIP;
    }
    console.warn('Unknown event type in hover middleware', event);
    return KEEP;
  };
};

const delayShow = (delay: number): HoverMiddleware => {
  let abortController = new AbortController();
  return async ({ event }) => {
    abortController.abort();
    const newAbortController = new AbortController();
    abortController = newAbortController;
    if (event.type !== 'mouseover') return true;
    if (delay <= 0) return true;
    await sleep(delay, newAbortController.signal);
    return !newAbortController.signal.aborted;
  };
};

const delayHide = (delay: number): HoverMiddleware => {
  let abortController = new AbortController();
  return async ({ event }) => {
    abortController.abort();
    const newAbortController = new AbortController();
    abortController = newAbortController;
    if (event.type !== 'mouseleave') return true;
    if (delay <= 0) return true;
    await sleep(delay, newAbortController.signal);
    return !newAbortController.signal.aborted;
  };
};

type SafeTriangleOptions = {
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
const safeTriangle = ({
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

/**
 * Call the `whenHoverChange` callback when the element is hovered.
 *
 * After the mouse leaves the element, there is a 300ms delay by default.
 *
 * Note: The callback may be called multiple times when the mouse is hovering or hovering out.
 *
 * See also https://floating-ui.com/docs/useHover
 *
 * @example
 * ```ts
 * private _setReference: RefOrCallback;
 *
 * connectedCallback() {
 *   let hoverTip: HTMLElement | null = null;
 *   const { setReference, setFloating } = whenHover(isHover => {
 *     if (!isHover) {
 *       hoverTips?.remove();
 *       return;
 *     }
 *     hoverTip = document.createElement('div');
 *     document.body.append(hoverTip);
 *     setFloating(hoverTip);
 *   }, { hoverDelay: 500 });
 *   this._setReference = setReference;
 * }
 *
 * render() {
 *   return html`
 *     <div ref=${this._setReference}></div>
 *   `;
 * }
 * ```
 */
export const whenHover = (
  whenHoverChange: (isHover: boolean, event?: Event) => void,
  {
    leaveDelay = 300,
    alwayRunWhenNoFloating = true,
    safeArea = false,
  }: WhenHoverOptions = {}
) => {
  /**
   * The event listener will be removed when the signal is aborted.
   */
  const abortController = new AbortController();
  let referenceElement: Element | undefined;
  let floatingElement: Element | undefined;

  const middlewares: HoverMiddleware[] = [
    dedupe(alwayRunWhenNoFloating),
    ...(safeArea
      ? [safeTriangle(typeof safeArea === 'boolean' ? undefined : safeArea)]
      : []),
    delayShow(0),
    delayHide(leaveDelay),
  ];

  let id = 0;
  let resId = 0;
  const onHoverChange = async (e: Event) => {
    const curId = id++;
    for (const middleware of middlewares) {
      const go = await middleware({
        event: e,
        floatingElement,
        referenceElement,
      });
      if (!go) {
        return;
      }
    }
    if (curId < resId)
      // ignore expired event
      return;
    resId = curId;
    if (e.type === 'mouseover') {
      whenHoverChange(true, e);
      return;
    }
    if (e.type === 'mouseleave') {
      whenHoverChange(false, e);
      return;
    }
    console.error('Unknown event type in whenHover', e);
  };

  const addHoverListener = (element?: Element) => {
    if (!element) return;
    // see https://stackoverflow.com/questions/14795099/pure-javascript-to-check-if-something-has-hover-without-setting-on-mouseover-ou
    const alreadyHover = element.matches(':hover');
    if (alreadyHover && !abortController.signal.aborted) {
      // When the element is already hovered, we need to trigger the callback manually
      onHoverChange(new MouseEvent('mouseover'));
    }
    element.addEventListener('mouseover', onHoverChange, {
      signal: abortController.signal,
    });
    element.addEventListener('mouseleave', onHoverChange, {
      signal: abortController.signal,
    });
  };
  const removeHoverListener = (element?: Element) => {
    if (!element) return;
    element.removeEventListener('mouseover', onHoverChange);
    element.removeEventListener('mouseleave', onHoverChange);
  };

  const setReference = (element?: Element) => {
    // Clean previous listeners
    removeHoverListener(referenceElement);
    addHoverListener(element);
    referenceElement = element;
  };

  const setFloating = (element?: Element) => {
    // Clean previous listeners
    removeHoverListener(floatingElement);
    addHoverListener(element);
    floatingElement = element;
  };

  return {
    setReference,
    setFloating,
    dispose: () => {
      abortController.abort();
    },
  };
};
