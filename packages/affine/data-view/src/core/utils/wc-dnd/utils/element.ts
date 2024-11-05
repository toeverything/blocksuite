export const asHTMLElement = (ele: unknown): HTMLElement | undefined => {
  return ele instanceof HTMLElement ? ele : undefined;
};
