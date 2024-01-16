import type { IBrush } from './brush/types.js';
import { type IConnector } from './connector/types.js';
import type { IShape } from './shape/types.js';
import type { IText } from './text/types.js';

// eslint-disable-next-line simple-import-sort/exports
export { ConnectorMode } from './connector/types.js';
export { SHAPE_TEXT_PADDING } from './shape/consts.js';
export { normalizeShapeBound } from './shape/utils.js';
export { getFontString, getLineHeight, getLineWidth } from './text/utils.js';
import type {
  CanvasElement,
  ShapeElementModel,
  TextElementModel,
} from '../element-model/index.js';

export type { CanvasElement };

export type CanvasElementWithText = ShapeElementModel | TextElementModel;

export type { IBrush, IConnector, IShape, IText };
