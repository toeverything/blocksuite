import { createPopper } from '@popperjs/core';

import { listenClickAway } from '../utils.js';

export function countBy<T>(items: T[], key: (item: T) => string | number) {
  const count: Record<string, number> = {};
  items.forEach(item => {
    const k = key(item);
    if (!count[k]) {
      count[k] = 0;
    }
    count[k] += 1;
  });
  return count;
}

export function maxBy<T>(items: T[], value: (item: T) => number) {
  if (!items.length) {
    return null;
  }
  let maxItem = items[0];
  let max = value(maxItem);

  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    const v = value(item);
    if (v > max) {
      max = v;
      maxItem = item;
    }
  }

  return maxItem;
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
