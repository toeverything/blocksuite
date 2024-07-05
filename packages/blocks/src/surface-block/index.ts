import type { SurfaceBlockModel } from './surface-model.js';
import type { SurfaceBlockService } from './surface-service.js';

export { normalizeShapeBound } from './canvas-renderer/element-renderer/index.js';
export { fitContent } from './canvas-renderer/element-renderer/shape/utils.js';
export { Overlay, Renderer } from './canvas-renderer/renderer.js';
export {
  type IBound,
  type IModelCoord,
  ShapeStyle,
  StrokeStyle,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
} from './consts.js';
export {
  AffineCanvasTextFonts,
  CommunityCanvasTextFonts,
  GRID_GAP_MAX,
  GRID_GAP_MIN,
} from './consts.js';
export { SurfaceElementModel } from './element-model/base.js';
export { BrushElementModel } from './element-model/brush.js';
export {
  type Connection,
  ConnectorElementModel,
  ConnectorEndpoint,
  ConnectorMode,
  DEFAULT_FRONT_END_POINT_STYLE,
  DEFAULT_REAR_END_POINT_STYLE,
  type PointStyle,
} from './element-model/connector.js';
export { GroupElementModel } from './element-model/group.js';
export { CanvasElementType } from './element-model/index.js';
export {
  LayoutType,
  MindmapElementModel,
  MindmapStyle,
} from './element-model/mindmap.js';
export { ShapeElementModel } from './element-model/shape.js';
export { TextElementModel } from './element-model/text.js';
export * from './elements/index.js';
export { ShapeType } from './elements/shape/consts.js';
export {
  markdownToMindmap,
  MindmapRootBlock,
  MindmapService,
  MindmapSurfaceBlock,
} from './mini-mindmap/index.js';
export { getStroke } from './perfect-freehand/getStroke.js';
export { RoughCanvas } from './rough/canvas.js';
export type { Options } from './rough/core.js';
export { SurfaceBlockModel } from './surface-model.js';
export { AStarRunner } from './utils/a-star.js';
export * from './utils/bound.js';
export * from './utils/index.js';
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
  rotatePoints,
  sign,
  toDegree,
  toRadian,
} from './utils/math-utils.js';
export { PointLocation } from './utils/point-location.js';
export { type IVec, type IVec2, Vec } from './utils/vec.js';
export * from './utils/xywh.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:surface': SurfaceBlockService;
    }
    interface BlockModels {
      'affine:surface': SurfaceBlockModel;
    }
  }
}
