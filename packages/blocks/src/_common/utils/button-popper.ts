import type { Disposable } from '@blocksuite/global/utils';

import { autoUpdate } from '@floating-ui/dom';
import {
  type Rect,
  autoPlacement,
  computePosition,
  offset,
  shift,
  size,
} from '@floating-ui/dom';

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

type Display = 'hidden' | 'show';

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
  stateUpdated: (state: { display: Display }) => void = () => {
    /** DEFAULT EMPTY FUNCTION */
  },
  {
    crossAxis,
    ignoreShift,
    mainAxis,
    rootBoundary,
  }: {
    crossAxis?: number;
    ignoreShift?: boolean;
    mainAxis?: number;
    rootBoundary?: (() => Rect | undefined) | Rect;
  } = {}
) {
  let display: Display = 'hidden';
  let cleanup: (() => void) | void;

  const originMaxHeight = window.getComputedStyle(popperElement).maxHeight;

  function compute() {
    const overflowOptions = {
      rootBoundary:
        typeof rootBoundary === 'function' ? rootBoundary() : rootBoundary,
    };

    computePosition(reference, popperElement, {
      middleware: [
        offset({
          crossAxis: crossAxis ?? 0,
          mainAxis: mainAxis ?? 14,
        }),
        autoPlacement({
          allowedPlacements: ['top', 'bottom'],
          ...overflowOptions,
        }),
        shift(overflowOptions),
        size({
          ...overflowOptions,
          apply({ availableHeight }) {
            popperElement.style.maxHeight = originMaxHeight
              ? `min(${originMaxHeight}, ${availableHeight}px)`
              : `${availableHeight}px`;
          },
        }),
      ],
    })
      .then(({ middlewareData: data, x, y }) => {
        if (!ignoreShift) {
          x += data.shift?.x ?? 0;
          y += data.shift?.y ?? 0;
        }
        Object.assign(popperElement.style, {
          left: `${x}px`,
          position: 'absolute',
          top: `${y}px`,
          zIndex: 1,
        });
      })
      .catch(console.error);
  }

  const show = () => {
    if (display === 'show') return;
    popperElement.setAttribute(ATTR_SHOW, '');
    display = 'show';
    stateUpdated({ display });

    cleanup = autoUpdate(reference, popperElement, compute, {
      animationFrame: true,
    });
  };

  const hide = () => {
    if (display === 'hidden') return;
    popperElement.removeAttribute(ATTR_SHOW);
    display = 'hidden';
    stateUpdated({ display });
    cleanup?.();
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
    dispose: () => {
      cleanup?.();
      clickAway.dispose();
    },
    hide,
    show,
    get state() {
      return display;
    },
    toggle,
  };
}
