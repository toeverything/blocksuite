export const getScrollContainer = (ele: HTMLElement) => {
  let container: HTMLElement | null = ele;
  while (ele && !isScrollable(ele)) {
    container = ele.parentElement;
  }
  return container ?? document.body;
};

export const isScrollable = (ele: HTMLElement) => {
  const value = ele.computedStyleMap().get('overflow-y')?.toString();
  return value === 'scroll' || value === 'auto';
};
