export {
  compare as compareLayer,
  renderableInEdgeless,
  SortOrder,
} from '../utils/layer.js';
export {
  descendantElementsImpl,
  getAncestorContainersImpl,
  getTopElements,
  hasDescendantElementImpl,
} from '../utils/tree.js';
export { GfxController, GfxControllerIdentifier } from './controller.js';
export * from './gfx-block-model.js';
export { GridManager } from './grid.js';
export { LayerManager, type ReorderingDirection } from './layer.js';
export {
  type GfxContainerElement,
  gfxContainerSymbol,
  isGfxContainerElm,
} from './surface/container-element.js';
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
} from './surface/decorators/index.js';
export {
  type BaseElementProps,
  type GfxElementGeometry,
  GfxGroupLikeElementModel as GfxGroupLikeElementModel,
  GfxLocalElementModel,
  GfxPrimitiveElementModel as GfxPrimitiveElementModel,
  type PointTestOptions,
  type SerializedElement,
} from './surface/element-model.js';
export {
  SurfaceBlockModel,
  type SurfaceBlockProps,
  type SurfaceMiddleware,
} from './surface/surface-model.js';
export * from './viewport.js';

export { GfxViewportElement } from './viewport-element.js';
export { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
