import { Text } from 'yjs';

import type { DatabaseAction, Divider } from './table/types.js';

// source (2018-03-11): https://github.com/jquery/jquery/blob/master/src/css/hiddenVisibleSelectors.js
function isVisible(elem: HTMLElement) {
  return (
    !!elem &&
    !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length)
  );
}

export function onClickOutside(
  element: HTMLElement,
  callback: (element: HTMLElement, target: HTMLElement) => void,
  event: 'click' | 'mousedown' = 'click',
  reusable = false
): () => void {
  const outsideClickListener = (event: Event) => {
    // support shadow dom
    const path = event.composedPath && event.composedPath();
    const isOutside = path
      ? path.indexOf(element) < 0
      : !element.contains(event.target as Node) && isVisible(element);

    if (!isOutside) return;

    callback(element, event.target as HTMLElement);
    // if reuseable, need to manually remove the listener
    if (!reusable) removeClickListener();
  };

  document.addEventListener(event, outsideClickListener);
  const removeClickListener = () => {
    document.removeEventListener(event, outsideClickListener);
  };

  return removeClickListener;
}

export type SelectOptionColor = {
  color: string;
  name: string;
};

export const selectOptionColors: SelectOptionColor[] = [
  {
    color: 'var(--affine-tag-red)',
    name: 'Red',
  },
  {
    color: 'var(--affine-tag-pink)',
    name: 'Pink',
  },
  {
    color: 'var(--affine-tag-orange)',
    name: 'Orange',
  },
  {
    color: 'var(--affine-tag-yellow)',
    name: 'Yellow',
  },
  {
    color: 'var(--affine-tag-green)',
    name: 'Green',
  },
  {
    color: 'var(--affine-tag-teal)',
    name: 'Teal',
  },
  {
    color: 'var(--affine-tag-blue)',
    name: 'Blue',
  },
  {
    color: 'var(--affine-tag-purple)',
    name: 'Purple',
  },
  {
    color: 'var(--affine-tag-gray)',
    name: 'Gray',
  },
  {
    color: 'var(--affine-tag-white)',
    name: 'White',
  },
];

/** select tag color poll */
const selectTagColorPoll = selectOptionColors.map(color => color.color);

function tagColorHelper() {
  let colors = [...selectTagColorPoll];
  return () => {
    if (colors.length === 0) {
      colors = [...selectTagColorPoll];
    }
    const index = Math.floor(Math.random() * colors.length);
    const color = colors.splice(index, 1)[0];
    return color;
  };
}

export const getTagColor = tagColorHelper();

export function isDivider(action: DatabaseAction): action is Divider {
  return action.type === 'divider';
}

export const isText = (value: unknown): value is Text => {
  return value instanceof Text;
};
