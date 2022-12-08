// eslint-disable-next-line @typescript-eslint/ban-types
export type ShapeStyles = {};

export function calcRectanglePath(
  style: ShapeStyles,
  [w, h]: [number, number] // w, h
) {
  w = Math.max(0, w);
  h = Math.max(0, h);
}
