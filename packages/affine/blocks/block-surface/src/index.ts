// oxlint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./effects.ts" />
export { type IModelCoord, ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from './consts.js';
export { GRID_GAP_MAX, GRID_GAP_MIN } from './consts.js';
export {
  SurfaceElementModel,
  SurfaceGroupLikeModel,
} from './element-model/base.js';
export { CanvasElementType } from './element-model/index.js';
import {
  isConnectorAndBindingsAllSelected,
  isConnectorWithLabel,
} from './managers/connector-manager.js';
export {
  calculateNearestLocation,
  ConnectionOverlay,
  ConnectorEndpointLocations,
  ConnectorEndpointLocationsOnTriangle,
  ConnectorPathGenerator,
  PathGenerator,
} from './managers/connector-manager.js';
export { CanvasRenderer } from './renderer/canvas-renderer.js';
export * from './renderer/elements/group/consts.js';
export type { ElementRenderer } from './renderer/elements/index.js';
export {
  elementRenderers,
  normalizeShapeBound,
} from './renderer/elements/index.js';
export { fitContent } from './renderer/elements/shape/utils.js';
export * from './renderer/elements/type.js';
export { Overlay, OverlayIdentifier } from './renderer/overlay.js';
export { MindMapView } from './view/mindmap.js';
import {
  getCursorByCoord,
  getLineHeight,
  isFontStyleSupported,
  isFontWeightSupported,
  normalizeTextBound,
  splitIntoLines,
} from './renderer/elements/text/utils.js';
import {
  getFontFaces,
  getFontFacesByFontFamily,
  isSameFontFamily,
  wrapFontFamily,
} from './utils/font.js';
export {
  EdgelessSurfaceBlockAdapterExtensions,
  SurfaceBlockAdapterExtensions,
} from './adapters/index.js';
export type { SurfaceContext } from './surface-block.js';
export { SurfaceBlockComponent } from './surface-block.js';
export {
  SurfaceBlockModel,
  SurfaceBlockSchema,
  SurfaceBlockSchemaExtension,
} from './surface-model.js';
export type { SurfaceBlockService } from './surface-service.js';
export {
  EdgelessSurfaceBlockSpec,
  PageSurfaceBlockSpec,
} from './surface-spec.js';
export { SurfaceBlockTransformer } from './surface-transformer.js';
export { AStarRunner } from './utils/a-star.js';
export {
  NODE_FIRST_LEVEL_HORIZONTAL_SPACING,
  NODE_HORIZONTAL_SPACING,
  NODE_VERTICAL_SPACING,
} from './utils/mindmap/layout.js';
export { RoughCanvas } from './utils/rough/canvas.js';

import {
  addTree,
  containsNode,
  createFromTree,
  detachMindmap,
  findTargetNode,
  hideNodeConnector,
  moveNode,
  tryMoveNode,
} from './utils/mindmap/utils';
export * from './extensions';
export {
  addNote,
  addNoteAtPoint,
  generateElementId,
  getBgGridGap,
  getLastPropsKey,
  getSurfaceBlock,
  normalizeWheelDeltaY,
} from './utils';
export * from './utils/mindmap/style-svg';
export type { Options } from './utils/rough/core';
export { sortIndex } from './utils/sort';
export { updateXYWH } from './utils/update-xywh.js';

export const ConnectorUtils = {
  isConnectorAndBindingsAllSelected,
  isConnectorWithLabel,
};

export const TextUtils = {
  splitIntoLines,
  normalizeTextBound,
  getLineHeight,
  getCursorByCoord,
  isFontWeightSupported,
  isFontStyleSupported,
  wrapFontFamily,
  getFontFaces,
  getFontFacesByFontFamily,
  isSameFontFamily,
};

export const MindmapUtils = {
  addTree,
  createFromTree,
  detachMindmap,
  moveNode,
  findTargetNode,
  tryMoveNode,
  hideNodeConnector,
  containsNode,
};

export * from './commands';
