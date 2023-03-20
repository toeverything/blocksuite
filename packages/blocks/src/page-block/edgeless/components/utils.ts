import type { Bound } from '@blocksuite/phasor';
import { deserializeXYWH, type SurfaceViewport } from '@blocksuite/phasor';
import { getCommonBound } from '@blocksuite/phasor';
import type { Disposable } from '@blocksuite/store';
import { createPopper } from '@popperjs/core';
import { html } from 'lit';

import type { Selectable } from '../selection-manager.js';
import { getSelectionBoxBound, getXYWH, isTopLevelBlock } from '../utils.js';

export function getCommonRectStyle(
  rect: DOMRect,
  active = false,
  selected = false
) {
  return {
    position: 'absolute',
    left: rect.x + 'px',
    top: rect.y + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px',
    borderRadius: '0',
    pointerEvents: 'none',
    boxSizing: 'border-box',
    zIndex: '1',
    backgroundColor: !active && selected ? 'var(--affine-selected-color)' : '',
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
      const [x, y, w, h] = deserializeXYWH(getXYWH(s));
      bound = { x, y, w, h };
    } else {
      bound = { x: s.x, y: s.y, w: s.w, h: s.h };
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
  popperElement: HTMLElement
) {
  const popper = createPopper(reference, popperElement, {
    placement: 'top',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 12],
        },
      },
    ],
  });

  const show = () => {
    popperElement.setAttribute(ATTR_SHOW, '');
    popper.setOptions(options => ({
      ...options,
      modifiers: [
        ...(options.modifiers ?? []),
        { name: 'eventListeners', enabled: false },
      ],
    }));
    popper.update();
  };

  const hide = () => {
    popperElement.removeAttribute(ATTR_SHOW);

    popper.setOptions(options => ({
      ...options,
      modifiers: [
        ...(options.modifiers ?? []),
        { name: 'eventListeners', enabled: false },
      ],
    }));
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
    popper,
    show,
    hide,
    toggle,
    dispose: () => {
      popper.destroy();
      clickAway.dispose();
    },
  };
}

export function getTooltipWithShortcut(tip: string, shortcut: string) {
  return html`<span>${tip}</span
    ><span style="margin-left: 10px;">${shortcut}</span>`;
}
