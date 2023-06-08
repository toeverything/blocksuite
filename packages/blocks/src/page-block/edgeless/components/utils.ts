import type { SurfaceViewport } from '@blocksuite/phasor';
import { Bound, getCommonBound } from '@blocksuite/phasor';
import type { Disposable } from '@blocksuite/store';
import { computePosition, offset } from '@floating-ui/dom';
import { html } from 'lit';

import type { Selectable } from '../selection-manager.js';
import { getSelectionBoxBound, getXYWH, isTopLevelBlock } from '../utils.js';

export function getCommonRectStyle(
  rect: DOMRect,
  active = false,
  selected = false
) {
  return {
    '--affine-border-width': `${active ? 2 : 1}px`,
    left: rect.x + 'px',
    top: rect.y + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
    backgroundColor: !active && selected ? 'var(--affine-hover-color)' : '',
  };
}

export function getSelectedRect(
  selected: Selectable[],
  viewport: SurfaceViewport
): DOMRect {
  if (selected.length === 0) {
    return new DOMRect(0, 0, 0, 0);
  }
  const rects = selected.map(selectable => {
    const { x, y, width, height } = getSelectionBoxBound(
      viewport,
      getXYWH(selectable)
    );

    return {
      x,
      y,
      w: width,
      h: height,
    };
  });

  const commonBound = getCommonBound(rects);
  return new DOMRect(
    commonBound?.x,
    commonBound?.y,
    commonBound?.w,
    commonBound?.h
  );
}

export function getSelectableBounds(
  selected: Selectable[]
): Map<string, Bound> {
  const bounds = new Map<string, Bound>();
  for (const s of selected) {
    let bound: Bound;
    if (isTopLevelBlock(s)) {
      bound = Bound.deserialize(getXYWH(s));
    } else {
      bound = new Bound(s.x, s.y, s.w, s.h);
    }
    bounds.set(s.id, bound);
  }
  return bounds;
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
