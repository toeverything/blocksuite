import { BrushElement } from './brush/brush-element.js';
import { BrushElementDefaultProps } from './brush/constants.js';
import type { IBrush } from './brush/types.js';
import { ConnectorElement } from './connector/connector-element.js';
import { ConnectorElementDefaultProps } from './connector/constants.js';
import type { IConnector } from './connector/types.js';
import {
  DebugElement,
  DebugElementDefaultProps,
  type IDebug,
} from './debug/debug-element.js';
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
export { BrushElement } from './brush/brush-element.js';
export { ConnectorElement } from './connector/connector-element.js';
export { DebugElement } from './debug/debug-element.js';
export { ShapeElement } from './shape/shape-element.js';
export type { ShapeType } from './shape/types.js';
export { TextElement } from './text/text-element.js';

export { normalizeShapeBound } from './shape/utils.js';
export { SHAPE_TEXT_PADDING } from './shape/constants.js';
export { normalizeTextBound } from './text/utils.js';
export type { HitTestOptions } from './surface-element.js';

export type PhasorElement =
  | ShapeElement
  | DebugElement
  | BrushElement
  | ConnectorElement
  | SurfaceElement;

export type PhasorElementType = {
  shape: ShapeElement;
  debug: DebugElement;
  brush: BrushElement;
  connector: ConnectorElement;
  text: TextElement;
};

export type IPhasorElementType = {
  shape: IShape;
  debug: IDebug;
  brush: IBrush;
  connector: IConnector;
  text: IText;
};

export type IPhasorElementLocalRecord = {
  shape: IShapeLocalRecord;
  debug: ISurfaceElementLocalRecord;
  brush: ISurfaceElementLocalRecord;
  connector: ISurfaceElementLocalRecord;
  text: ISurfaceElementLocalRecord;
};

export const ElementCtors = {
  debug: DebugElement,
  brush: BrushElement,
  shape: ShapeElement,
  connector: ConnectorElement,
  text: TextElement,
} as const;

export const ElementDefaultProps: Record<
  keyof IPhasorElementType,
  IElementDefaultProps<keyof IPhasorElementType>
> = {
  debug: DebugElementDefaultProps,
  brush: BrushElementDefaultProps,
  shape: ShapeElementDefaultProps,
  connector: ConnectorElementDefaultProps,
  text: TextElementDefaultProps,
} as const;

export type IElementCreateProps<T extends keyof IPhasorElementType> = Partial<
  Omit<IPhasorElementType[T], 'id' | 'index' | 'seed'>
>;

export type IElementUpdateProps<T extends keyof IPhasorElementType> = Partial<
  Omit<IPhasorElementType[T], 'id' | 'index' | 'seed' | 'type'>
>;

export type IElementDefaultProps<T extends keyof IPhasorElementType> =
  T extends 'connector'
    ? Omit<
        IPhasorElementType['connector'],
        | 'xywh'
        | 'id'
        | 'index'
        | 'seed'
        | 'path'
        | 'absolutePath'
        | 'controllers'
        | 'rotate'
      >
    : Omit<IPhasorElementType[T], 'id' | 'index' | 'seed'>;

export type PhasorElementWithText = ShapeElement | TextElement;

export type { IBrush, IConnector, IDebug, IShape, IText };
