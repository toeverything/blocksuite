export const getScrollContainer = (ele: HTMLElement) => {
  let container: HTMLElement | null = ele;
  while (container && !isScrollable(container)) {
    container = container.parentElement;
  }
  return container ?? document.body;
};

export const isScrollable = (ele: HTMLElement) => {
  const value = window.getComputedStyle(ele).overflowY;
  return value === 'scroll' || value === 'auto';
};
