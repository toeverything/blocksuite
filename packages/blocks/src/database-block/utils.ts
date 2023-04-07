import type { DatabaseAction, Divider } from './types.js';

// source (2018-03-11): https://github.com/jquery/jquery/blob/master/src/css/hiddenVisibleSelectors.js
function isVisible(elem: HTMLElement) {
  return (
    !!elem &&
    !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length)
  );
}

export function onClickOutside(
  element: HTMLElement,
  callback: (element: HTMLElement) => void,
  event: 'click' | 'mousedown' = 'click'
): () => void {
  const outsideClickListener = (event: Event) => {
    if (!element.contains(event.target as Node) && isVisible(element)) {
      // or use: event.target.closest(selector) === null
      callback(element);
      removeClickListener();
    }
  };

  document.addEventListener(event, outsideClickListener);

  const removeClickListener = () => {
    document.removeEventListener(event, outsideClickListener);
  };

  return removeClickListener;
}

/** select tag color poll */
const tagColorPoll: string[] = [
  '#F5F5F5',
  '#E3E2E0',
  '#FFE1E1',
  '#FFEACA',
  '#FFF4D8',
  '#DFF4E8',
  '#DFF4F3',
  '#E1EFFF',
  '#F3F0FF',
  '#FCE8FF',
];

function tagColorHelper() {
  let colors = [...tagColorPoll];
  return () => {
    if (colors.length === 0) {
      colors = [...tagColorPoll];
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
