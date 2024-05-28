import type { IShape } from './shape/types.js';

export { getFontString, getLineHeight, getLineWidth } from './text/utils.js';

import type {
  ShapeElementModel,
  TextElementModel,
} from '../element-model/index.js';

export type CanvasElementWithText = ShapeElementModel | TextElementModel;

export type { IShape };
