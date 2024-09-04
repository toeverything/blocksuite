export { type IModelCoord, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from './consts.js';
export {
  AffineCanvasTextFonts,
  CommunityCanvasTextFonts,
  GRID_GAP_MAX,
  GRID_GAP_MIN,
} from './consts.js';
export { SurfaceElementModel } from './element-model/base.js';
export { CanvasElementType } from './element-model/index.js';
export {
  LayoutType,
  MindmapElementModel,
  MindmapStyle,
} from './element-model/mindmap.js';
export * from './elements/index.js';
export {
  MindmapRootBlock,
  MindmapService,
  MindmapSurfaceBlock,
  markdownToMindmap,
} from './mini-mindmap/index.js';
export { CanvasRenderer, Overlay } from './renderer/canvas-renderer.js';
export { normalizeShapeBound } from './renderer/elements/index.js';
export { fitContent } from './renderer/elements/shape/utils.js';
export { SurfaceBlockModel as SurfaceBlockModel } from './surface-model.js';
export { AStarRunner } from './utils/a-star.js';
export * from './utils/index.js';
export { RoughCanvas } from './utils/rough/canvas.js';
export type { Options } from './utils/rough/core.js';
export {
  BrushElementModel,
  type Connection,
  ConnectorElementModel,
  ConnectorEndpoint,
  ConnectorMode,
  DEFAULT_FRONT_END_POINT_STYLE,
  DEFAULT_REAR_END_POINT_STYLE,
  GroupElementModel,
  type PointStyle,
  ShapeElementModel,
  TextElementModel,
} from '@blocksuite/affine-model';

export {
  almostEqual,
  clamp,
  getBoundsWithRotation,
  getPointFromBoundsWithRotation,
  getPointsFromBoundsWithRotation,
  getQuadBoundsWithRotation,
  getStroke,
  getSvgPathFromStroke,
  intersects,
  isOverlap,
  isPointIn,
  lineIntersects,
  linePolygonIntersects,
  normalizeDegAngle,
  polyLineNearestPoint,
  polygonGetPointTangent,
  polygonNearestPoint,
  polygonPointDistance,
  rotatePoints,
  sign,
  toDegree,
  toRadian,
} from '@blocksuite/global/utils';
