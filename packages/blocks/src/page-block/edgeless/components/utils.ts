import {
  type IVec,
  normalizeDegAngle,
  type SurfaceManager,
  Vec,
} from '@blocksuite/phasor';
import { assertExists, type Disposable } from '@blocksuite/store';
import { computePosition, flip, offset } from '@floating-ui/dom';
import { css, html } from 'lit';

// "<svg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'><g><path fill='white' d='M13.7,18.5h3.9l0-1.5c0-1.4-1.2-2.6-2.6-2.6h-1.5v3.9l-5.8-5.8l5.8-5.8v3.9h2.3c3.1,0,5.6,2.5,5.6,5.6v2.3h3.9l-5.8,5.8L13.7,18.5z'/><path d='M20.4,19.4v-3.2c0-2.6-2.1-4.7-4.7-4.7h-3.2l0,0V9L9,12.6l3.6,3.6v-2.6l0,0H15c1.9,0,3.5,1.6,3.5,3.5v2.4l0,0h-2.6l3.6,3.6l3.6-3.6L20.4,19.4L20.4,19.4z'/></g></svg>";
export function generateCursorUrl(angle = 0, fallback = css`default`) {
  return css`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cg transform='rotate(${angle} 16 16)'%3E%3Cpath fill='white' d='M13.7,18.5h3.9l0-1.5c0-1.4-1.2-2.6-2.6-2.6h-1.5v3.9l-5.8-5.8l5.8-5.8v3.9h2.3c3.1,0,5.6,2.5,5.6,5.6v2.3h3.9l-5.8,5.8L13.7,18.5z'/%3E%3Cpath d='M20.4,19.4v-3.2c0-2.6-2.1-4.7-4.7-4.7h-3.2l0,0V9L9,12.6l3.6,3.6v-2.6l0,0H15c1.9,0,3.5,1.6,3.5,3.5v2.4l0,0h-2.6l3.6,3.6l3.6-3.6L20.4,19.4L20.4,19.4z'/%3E%3C/g%3E%3C/svg%3E") 16 16, ${fallback}`;
}

export function getCommonRectStyle(
  rect: DOMRect,
  active = false,
  selected = false,
  rotate = 0
) {
  return {
    '--affine-border-width': `${active ? 2 : 1}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    transform: `translate(${rect.x}px, ${rect.y}px) rotate(${rotate}deg)`,
    backgroundColor: !active && selected ? 'var(--affine-hover-color)' : '',
  };
}

export function listenClickAway(
  element: HTMLElement,
  onClickAway: () => void
): Disposable {
  const callback = (event: MouseEvent) => {
    const inside = event.composedPath().includes(element);
    if (!inside) {
      onClickAway();
    }
  };

  document.addEventListener('click', callback);

  return {
    dispose: () => {
      document.removeEventListener('click', callback);
    },
  };
}

const ATTR_SHOW = 'data-show';
/**
 * Using attribute 'data-show' to control popper visibility.
 *
 * ```css
 * selector {
 *   display: none;
 * }
 * selector[data-show] {
 *   display: block;
 * }
 * ```
 */
export function createButtonPopper(
  reference: HTMLElement,
  popperElement: HTMLElement,
  stateUpdated: (state: { display: 'show' | 'hidden' }) => void = () => {
    /** DEFAULT EMPTY FUNCTION */
  }
) {
  function compute() {
    computePosition(reference, popperElement, {
      placement: 'top',
      middleware: [
        offset({
          mainAxis: 10,
        }),
        flip({
          fallbackPlacements: ['bottom'],
        }),
      ],
    }).then(({ x, y }) => {
      Object.assign(popperElement.style, {
        position: 'absolute',
        zIndex: 1,
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  }

  const show = () => {
    popperElement.setAttribute(ATTR_SHOW, '');
    compute();
    stateUpdated({ display: 'show' });
  };

  const hide = () => {
    popperElement.removeAttribute(ATTR_SHOW);

    compute();
    stateUpdated({ display: 'hidden' });
  };

  const toggle = () => {
    if (popperElement.hasAttribute(ATTR_SHOW)) {
      hide();
    } else {
      show();
    }
  };

  const clickAway = listenClickAway(reference, () => hide());

  return {
    show,
    hide,
    toggle,
    dispose: () => {
      clickAway.dispose();
    },
  };
}

export function getTooltipWithShortcut(tip: string, shortcut: string) {
  return html`<span>${tip}</span
    ><span style="margin-left: 10px;">(${shortcut})</span>`;
}

export function readImageSize(file: File) {
  return new Promise<{ width: number; height: number }>(resolve => {
    const reader = new FileReader();
    const size = { width: 0, height: 0 };
    reader.addEventListener('load', _ => {
      const img = new Image();
      img.onload = () => {
        size.width = img.width;
        size.height = img.height;
        resolve(size);
      };
      img.onerror = () => resolve(size);
      img.src = reader.result as string;
    });
    reader.addEventListener('error', () => resolve(size));
    reader.readAsDataURL(file);
  });
}

const RESIZE_CURSORS = ['ew', 'nwse', 'ns', 'nesw'];
export function rotateResizeCursor(angle: number) {
  const a = Math.round(angle / (Math.PI / 4));
  const cursor = RESIZE_CURSORS[a % RESIZE_CURSORS.length];
  return cursor;
}

export function calcAngle(target: HTMLElement, point: IVec, offset = 0) {
  const rect = target
    .closest('.affine-edgeless-selected-rect')
    ?.getBoundingClientRect();
  assertExists(rect);
  const { left, top, right, bottom } = rect;
  const center = Vec.med([left, top], [right, bottom]);
  return normalizeDegAngle(
    ((Vec.angle(center, point) + offset) * 180) / Math.PI
  );
}

export function calcAngleWithRotation(
  target: HTMLElement,
  point: IVec,
  rect: DOMRect,
  rotate: number,
  surface: SurfaceManager
) {
  const handle = target.parentElement;
  assertExists(handle);
  const ariaLabel = handle.getAttribute('aria-label');
  assertExists(ariaLabel);
  const { left, top, right, bottom, width, height } = rect;
  const size = Math.min(width, height);
  const sx = size / width;
  const sy = size / height;
  const center = Vec.med([left, top], [right, bottom]);
  const draggingPoint = [0, 0];

  switch (ariaLabel) {
    case 'top-left': {
      draggingPoint[0] = left;
      draggingPoint[1] = top;
      break;
    }
    case 'top-right': {
      draggingPoint[0] = right;
      draggingPoint[1] = top;
      break;
    }
    case 'bottom-right': {
      draggingPoint[0] = right;
      draggingPoint[1] = bottom;
      break;
    }
    case 'bottom-left': {
      draggingPoint[0] = left;
      draggingPoint[1] = bottom;
      break;
    }
  }

  const dp = new DOMMatrix()
    .translateSelf(center[0], center[1])
    .rotateSelf(rotate)
    .translateSelf(-center[0], -center[1])
    .transformPoint(new DOMPoint(...draggingPoint));

  const m = new DOMMatrix()
    .translateSelf(dp.x, dp.y)
    .rotateSelf(rotate)
    .translateSelf(-dp.x, -dp.y)
    .scaleSelf(sx, sy, 1, dp.x, dp.y, 0)
    .translateSelf(dp.x, dp.y)
    .rotateSelf(-rotate)
    .translateSelf(-dp.x, -dp.y);

  const c = new DOMPoint(...center).matrixTransform(m);

  const p = surface.toModelCoord(point[0], point[1]);

  return normalizeDegAngle((Vec.angle([c.x, c.y], p) * 180) / Math.PI);
}
