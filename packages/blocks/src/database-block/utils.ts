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

/** select tag color poll */
const tagColorPoll: string[] = [
  'var(--affine-tag-blue)',
  'var(--affine-tag-green)',
  'var(--affine-tag-teal)',
  'var(--affine-tag-white)',
  'var(--affine-tag-purple)',
  'var(--affine-tag-red)',
  'var(--affine-tag-pink)',
  'var(--affine-tag-yellow)',
  'var(--affine-tag-orange)',
  'var(--affine-tag-gray)',
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
