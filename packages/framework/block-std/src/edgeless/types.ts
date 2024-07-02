/**
 * Including the essential types that are used in the edgeless block.
 */

/**
 * XYWH represents the x, y, width, and height of a block.
 */
export type XYWH = [number, number, number, number];

/**
 * SerializedXYWH is a string that represents the x, y, width, and height of a block.
 */
export type SerializedXYWH = `[${number},${number},${number},${number}]`;

/**
 * Represents the x, y, width, and height of a block that can be easily accessed.
 */
export interface IBound {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
}

/**
 * Represents a point in the viewport.
 */
export interface IPoint {
  x: number;
  y: number;
}
