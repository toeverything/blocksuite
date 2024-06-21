export const getScrollContainer = (ele: HTMLElement) => {
  let container: HTMLElement | null = ele;
  while (
    container &&
    !isScrollable(container.computedStyleMap().get('overflow-y')?.toString())
  ) {
    container = container.parentElement;
  }
  return container ?? document.body;
};
const isScrollable = (style?: string) => {
  return style === 'scroll' || style === 'auto';
};
