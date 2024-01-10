import { BrushElement } from './brush/brush-element.js';
import { BrushElementDefaultProps } from './brush/consts.js';
import type { IBrush } from './brush/types.js';
import { ConnectorElement } from './connector/connector-element.js';
import { ConnectorElementDefaultProps } from './connector/consts.js';
import { type IConnector } from './connector/types.js';
import type {
  ICanvasElementType,
  IElementDefaultProps,
} from './edgeless-element.js';
import { GroupElementDefaultProps } from './group/consts.js';
import { GroupElement } from './group/group-element.js';
import { ShapeElementDefaultProps } from './shape/consts.js';
import { ShapeElement } from './shape/shape-element.js';
import type { IShape } from './shape/types.js';
import { TextElementDefaultProps } from './text/consts.js';
import { TextElement } from './text/text-element.js';
import type { IText } from './text/types.js';

// eslint-disable-next-line simple-import-sort/exports
export { BrushElement } from './brush/brush-element.js';
export { ConnectorElement } from './connector/connector-element.js';
export { ShapeElement } from './shape/shape-element.js';
export { TextElement } from './text/text-element.js';
export { GroupElement } from './group/group-element.js';

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

export const ElementCtors = {
  brush: BrushElement,
  shape: ShapeElement,
  connector: ConnectorElement,
  text: TextElement,
  group: GroupElement,
} as const;

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
