import type { SurfaceBlockModel } from './surface-model.js';
import type { SurfaceBlockService } from './surface-service.js';

export { type IModelCoord, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from './consts.js';
export {
  AffineCanvasTextFonts,
  CommunityCanvasTextFonts,
  GRID_GAP_MAX,
  GRID_GAP_MIN,
  TextResizing,
} from './consts.js';

export {
  SurfaceElementModel,
  SurfaceGroupLikeModel,
} from './element-model/base.js';
export { CanvasElementType } from './element-model/index.js';
export {
  LayoutType,
  MindmapElementModel,
  MindmapStyle,
} from './element-model/mindmap.js';
export type { MindmapNode } from './element-model/utils/mindmap/layout.js';
export * from './elements/index.js';
export {
  ConnectionOverlay,
  ConnectorPathGenerator,
  ConnectorEndpointLocations,
  ConnectorEndpointLocationsOnTriangle,
  calculateNearestLocation,
} from './managers/connector-manager.js';
export { LayerManager } from './managers/layer-manager.js';
export type { ReorderingDirection } from './managers/layer-manager.js';
export {
  compare as compareLayer,
  SortOrder,
  renderableInEdgeless,
} from './managers/layer-utils.js';
export { CanvasRenderer, Overlay } from './renderer/canvas-renderer.js';
export type { ElementRenderer } from './renderer/elements/index.js';
export {
  normalizeShapeBound,
  elementRenderers,
} from './renderer/elements/index.js';
export { fitContent } from './renderer/elements/shape/utils.js';
export {
  splitIntoLines,
  normalizeTextBound,
  getLineHeight,
} from './renderer/elements/text/utils.js';
export { SurfaceBlockComponent } from './surface-block.js';
export type { SurfaceContext } from './surface-block.js';
export { SurfaceBlockModel, SurfaceBlockSchema } from './surface-model.js';
export type { SurfaceBlockService } from './surface-service.js';
export {
  PageSurfaceBlockSpec,
  EdgelessSurfaceBlockSpec,
} from './surface-spec.js';
export { SurfaceBlockTransformer } from './surface-transformer.js';
export { AStarRunner } from './utils/a-star.js';
export {
  wrapFontFamily,
  getFontFaces,
  getFontFacesByFontFamily,
  isSameFontFamily,
} from './utils/font.js';
export * from './utils/index.js';
export { RoughCanvas } from './utils/rough/canvas.js';
export type { Options } from './utils/rough/core.js';
export { sortIndex } from './utils/sort.js';

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
