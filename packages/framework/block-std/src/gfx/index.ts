export * from './gfx-block-model.js';
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
  type GfxContainerElement,
  type GfxElementGeometry,
  GfxGroupLikeElementModel as GfxGroupLikeElementModel,
  GfxLocalElementModel,
  GfxPrimitiveElementModel as GfxPrimitiveElementModel,
  type PointTestOptions,
  type SerializedElement,
  gfxContainerSymbol,
  isGfxContainerElm,
} from './surface/element-model.js';
export {
  SurfaceBlockModel,
  type SurfaceBlockProps,
  type SurfaceMiddleware,
} from './surface/surface-model.js';
export * from './viewport.js';
export { GfxViewportElement } from './viewport-element.js';

export { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';
