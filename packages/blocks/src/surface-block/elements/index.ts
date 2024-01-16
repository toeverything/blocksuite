import { BrushElementDefaultProps } from './brush/consts.js';
import type { IBrush } from './brush/types.js';
import { ConnectorElementDefaultProps } from './connector/consts.js';
import { type IConnector } from './connector/types.js';
import type {
  ICanvasElementType,
  IElementDefaultProps,
} from './edgeless-element.js';
import { GroupElementDefaultProps } from './group/consts.js';
import { ShapeElementDefaultProps } from './shape/consts.js';
import type { IShape } from './shape/types.js';
import { TextElementDefaultProps } from './text/consts.js';
import type { IText } from './text/types.js';

// eslint-disable-next-line simple-import-sort/exports
export { ConnectorMode } from './connector/types.js';
export { SHAPE_TEXT_PADDING } from './shape/consts.js';
export { normalizeShapeBound } from './shape/utils.js';
export {
  getFontString,
  getLineHeight,
  getLineWidth,
  normalizeTextBound,
} from './text/utils.js';
import type {
  CanvasElement,
  ShapeElementModel,
  TextElementModel,
} from '../element-model/index.js';

export type { CanvasElement };

export const ElementDefaultProps: Record<
  keyof ICanvasElementType,
  IElementDefaultProps<keyof ICanvasElementType>
> = {
  brush: BrushElementDefaultProps,
  shape: ShapeElementDefaultProps,
  connector: ConnectorElementDefaultProps,
  text: TextElementDefaultProps,
  group: GroupElementDefaultProps,
} as const;

export type CanvasElementWithText = ShapeElementModel | TextElementModel;

export type { IBrush, IConnector, IShape, IText };
