import { BrushElement } from './brush/brush-element.js';
import { BrushElementDefaultProps } from './brush/constants.js';
import type { IBrush } from './brush/types.js';
import { ConnectorElement } from './connector/connector-element.js';
import { ConnectorElementDefaultProps } from './connector/constants.js';
import { type IConnector } from './connector/types.js';
import type {
  IElementDefaultProps,
  IPhasorElementType,
} from './edgeless-element.js';
import { ShapeElementDefaultProps } from './shape/constants.js';
import { ShapeElement } from './shape/shape-element.js';
import type { IShape, IShapeLocalRecord } from './shape/types.js';
import type {
  ISurfaceElementLocalRecord,
  SurfaceElement,
} from './surface-element.js';
import { TextElementDefaultProps } from './text/constants.js';
import { TextElement } from './text/text-element.js';
import type { IText } from './text/types.js';

// eslint-disable-next-line simple-import-sort/exports
export { ConnectorMode } from './connector/types.js';
export { BrushElement } from './brush/brush-element.js';
export { ConnectorElement } from './connector/connector-element.js';
export { ShapeElement } from './shape/shape-element.js';
export type { ShapeType } from './shape/types.js';
export { TextElement } from './text/text-element.js';

export { normalizeShapeBound } from './shape/utils.js';
export { SHAPE_TEXT_PADDING } from './shape/constants.js';
export {
  normalizeTextBound,
  getFontString,
  getLineHeight,
  getLineWidth,
} from './text/utils.js';

export type PhasorElement =
  | ShapeElement
  | BrushElement
  | ConnectorElement
  | SurfaceElement;

export type PhasorTypeToElement = {
  shape: ShapeElement;
  brush: BrushElement;
  connector: ConnectorElement;
  text: TextElement;
};

export type IPhasorElementLocalRecord = {
  shape: IShapeLocalRecord;
  brush: ISurfaceElementLocalRecord;
  connector: ISurfaceElementLocalRecord;
  text: ISurfaceElementLocalRecord;
};

export const ElementCtors = {
  brush: BrushElement,
  shape: ShapeElement,
  connector: ConnectorElement,
  text: TextElement,
} as const;

export const ElementDefaultProps: Record<
  keyof IPhasorElementType,
  IElementDefaultProps<keyof IPhasorElementType>
> = {
  brush: BrushElementDefaultProps(),
  shape: ShapeElementDefaultProps(),
  connector: ConnectorElementDefaultProps(),
  text: TextElementDefaultProps(),
} as const;

export type PhasorElementWithText = ShapeElement | TextElement;

export type { IBrush, IConnector, IShape, IText };
