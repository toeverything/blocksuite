import type {
  ShapeElementModel,
  TextElementModel,
} from '../element-model/index.js';
import type { IShape } from './shape/types.js';

export type CanvasElementWithText = ShapeElementModel | TextElementModel;

export type { IShape };
