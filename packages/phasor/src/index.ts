/// <reference types="@blocksuite/global" />
export {
  type IBound,
  type IModelCoord,
  StrokeStyle,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
} from './consts.js';
export { GRID_GAP_MAX, GRID_GAP_MIN } from './consts.js';
export type { Controller } from './elements/connector/types.js';
export { type Connection, ConnectorMode } from './elements/connector/types.js';
export { getArrowPoints } from './elements/connector/utils.js';
export * from './elements/index.js';
export { compare } from './grid.js';
export { getStroke } from './perfect-freehand/getStroke.js';
export type { SurfaceViewport } from './renderer.js';
export { Overlay, Renderer } from './renderer.js';
export { RoughCanvas } from './rough/canvas.js';
export type { Options } from './rough/core.js';
export * from './surface.js';
export { AStarRunner } from './utils/a-star.js';
export * from './utils/bound.js';
export {
  almostEqual,
  clamp,
  getBoundsWithRotation,
  getPointFromBoundsWithRotation,
  getPointsFromBoundsWithRotation,
  getQuadBoundsWithRotation,
  getSvgPathFromStroke,
  intersects,
  isOverlap,
  isPointIn,
  lineIntersects,
  linePolygonIntersects,
  normalizeDegAngle,
  polygonGetPointTangent,
  polygonNearestPoint,
  polygonPointDistance,
  polyLineNearestPoint,
  sign,
  toRadian,
} from './utils/math-utils.js';
export { PointLocation } from './utils/point-location.js';
export * from './utils/std.js';
export { type IVec, Vec } from './utils/vec.js';
export * from './utils/xywh.js';
