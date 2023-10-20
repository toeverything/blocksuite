import { BrushElement } from './brush/brush-element.js';
import { BrushElementDefaultProps } from './brush/consts.js';
import type { IBrush } from './brush/types.js';
import { ConnectorElement } from './connector/connector-element.js';
import { ConnectorElementDefaultProps } from './connector/consts.js';
import { type IConnector } from './connector/types.js';
import type {
  IElementDefaultProps,
  IPhasorElementType,
} from './edgeless-element.js';
import { GroupElement } from './group/group-element.js';
import { ShapeElementDefaultProps } from './shape/consts.js';
import { ShapeElement } from './shape/shape-element.js';
import type { IShape, IShapeLocalRecord } from './shape/types.js';
import type {
  ISurfaceElementLocalRecord,
  SurfaceElement,
} from './surface-element.js';
import { TextElementDefaultProps } from './text/consts.js';
import { TextElement } from './text/text-element.js';
import type { IText } from './text/types.js';

// eslint-disable-next-line simple-import-sort/exports
export {
  GroupElement,
  BrushElement,
  ShapeElement,
  TextElement,
  ConnectorElement,
};
export { ConnectorMode } from './connector/types.js';
export { SHAPE_TEXT_PADDING } from './shape/consts.js';
export type { ShapeType } from './shape/types.js';
export { normalizeShapeBound } from './shape/utils.js';
export {
  getFontString,
  getLineHeight,
  getLineWidth,
  normalizeTextBound,
} from './text/utils.js';

export type PhasorElement =
  | ShapeElement
  | BrushElement
  | ConnectorElement
  | SurfaceElement
  | GroupElement;

export type PhasorTypeToElement = {
  shape: ShapeElement;
  brush: BrushElement;
  connector: ConnectorElement;
  text: TextElement;
  group: GroupElement;
};

export type IPhasorElementLocalRecord = {
  shape: IShapeLocalRecord;
  brush: ISurfaceElementLocalRecord;
  connector: ISurfaceElementLocalRecord;
  text: ISurfaceElementLocalRecord;
  group: ISurfaceElementLocalRecord;
};

export const ElementCtors = {
  brush: BrushElement,
  shape: ShapeElement,
  connector: ConnectorElement,
  text: TextElement,
  group: GroupElement,
} as const;

export const ElementDefaultProps: Record<
  keyof IPhasorElementType,
  IElementDefaultProps<keyof IPhasorElementType>
> = {
  brush: BrushElementDefaultProps,
  shape: ShapeElementDefaultProps,
  connector: ConnectorElementDefaultProps,
  text: TextElementDefaultProps,
  group: GroupElementDefaultProps,
} as const;

export type PhasorElementWithText = ShapeElement | TextElement;

export type { IBrush, IConnector, IShape, IText };
