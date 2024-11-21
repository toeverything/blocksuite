export {
  compare as compareLayer,
  renderableInEdgeless,
  SortOrder,
} from '../utils/layer.js';
export {
  canSafeAddToContainer,
  descendantElementsImpl,
  getAncestorContainersImpl,
  getTopElements,
  hasDescendantElementImpl,
} from '../utils/tree.js';
export { GfxController } from './controller.js';
export { GfxExtension, GfxExtensionIdentifier } from './extension.js';
export { GridManager } from './grid.js';
export { GfxControllerIdentifier } from './identifiers.js';
export { LayerManager, type ReorderingDirection } from './layer.js';
export {
  type GfxCompatibleInterface,
  type GfxElementGeometry,
  type PointTestOptions,
} from './model/base.js';
export {
  type GfxGroupCompatibleInterface,
  gfxGroupCompatibleSymbol,
  isGfxGroupCompatibleModel,
} from './model/base.js';
export {
  GfxBlockElementModel,
  GfxCompatibleBlockModel as GfxCompatible,
  type GfxCompatibleProps,
} from './model/gfx-block-model.js';
export { type GfxModel } from './model/model.js';
export {
  convert,
  convertProps,
  derive,
  field,
  getDerivedProps,
  getFieldPropsSet,
  initializeObservers,
  initializeWatchers,
  local,
  observe,
  updateDerivedProps,
  watch,
} from './model/surface/decorators/index.js';
export {
  type BaseElementProps,
  GfxGroupLikeElementModel,
  GfxLocalElementModel,
  GfxPrimitiveElementModel,
  type SerializedElement,
} from './model/surface/element-model.js';
export {
  SurfaceBlockModel,
  type SurfaceBlockProps,
  type SurfaceMiddleware,
} from './model/surface/surface-model.js';
export { GfxSelectionManager } from './selection.js';

export {
  SurfaceMiddlewareBuilder,
  SurfaceMiddlewareExtension,
} from './surface-middleware.js';

export {
  BaseTool,
  type GfxToolsFullOption,
  type GfxToolsFullOptionValue,
  type GfxToolsMap,
  type GfxToolsOption,
} from './tool/tool.js';
export { MouseButton, ToolController } from './tool/tool-controller.js';
export * from './viewport.js';
export { GfxViewportElement } from './viewport-element.js';
export { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
