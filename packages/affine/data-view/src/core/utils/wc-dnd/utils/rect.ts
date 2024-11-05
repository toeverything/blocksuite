/**
 * Returns the bounding client rect of an element relative to the viewport.
 */
export function getClientRect(element: Element) {
  const { top, left, width, height, bottom, right } =
    element.getBoundingClientRect();

  return {
    top,
    left,
    width,
    height,
    bottom,
    right,
  };
}
