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
