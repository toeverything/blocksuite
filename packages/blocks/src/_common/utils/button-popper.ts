import { type Disposable } from '@blocksuite/global/utils';
import { computePosition, flip, offset, shift } from '@floating-ui/dom';

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
  },
  mainAxis?: number,
  crossAxis?: number
) {
  let state = 'hidden';

  function compute() {
    computePosition(reference, popperElement, {
      placement: 'top',
      middleware: [
        offset({
          mainAxis: mainAxis ?? 14,
          crossAxis: crossAxis ?? 0,
        }),
        flip({
          fallbackPlacements: ['bottom'],
        }),
        shift({
          padding: 10,
        }),
      ],
    })
      .then(({ x, y }) => {
        Object.assign(popperElement.style, {
          position: 'absolute',
          zIndex: 1,
          left: `${x}px`,
          top: `${y}px`,
        });
      })
      .catch(console.error);
  }

  const show = () => {
    popperElement.setAttribute(ATTR_SHOW, '');
    compute();
    state = 'show';
    stateUpdated({ display: 'show' });
  };

  const hide = () => {
    if (!popperElement) return;
    popperElement.removeAttribute(ATTR_SHOW);

    compute();
    state = 'hidden';
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
    get state() {
      return state;
    },
    show,
    hide,
    toggle,
    dispose: () => {
      clickAway.dispose();
    },
  };
}
