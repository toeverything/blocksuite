import { BrushElement } from './brush/brush-element.js';
import { BrushElementDefaultProps } from './brush/constants.js';
import type { IBrush } from './brush/types.js';
import { ConnectorElement } from './connector/connector-element.js';
import { ConnectorElementDefaultProps } from './connector/constants.js';
import { type IConnector } from './connector/types.js';
import {
  DebugElement,
  DebugElementDefaultProps,
  type IDebug,
} from './debug/debug-element.js';
import { FrameElementDefaultProps } from './frame/constants.js';
import { FrameElement } from './frame/frame-element.js';
import type { IFrame, IFrameLocalRecord } from './frame/types.js';
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
export { DebugElement } from './debug/debug-element.js';
export { ShapeElement } from './shape/shape-element.js';
export type { ShapeType } from './shape/types.js';
export { TextElement } from './text/text-element.js';
export { FrameElement } from './frame/frame-element.js';

export { normalizeShapeBound } from './shape/utils.js';
export { SHAPE_TEXT_PADDING } from './shape/constants.js';
export {
  normalizeTextBound,
  getFontString,
  getLineHeight,
  getLineWidth,
} from './text/utils.js';
export type { HitTestOptions } from './surface-element.js';

export type PhasorElement =
  | ShapeElement
  | DebugElement
  | BrushElement
  | ConnectorElement
  | FrameElement
  | SurfaceElement;

export type PhasorElementType = {
  shape: ShapeElement;
  debug: DebugElement;
  brush: BrushElement;
  connector: ConnectorElement;
  text: TextElement;
  frame: FrameElement;
};

export type IPhasorElementType = {
  shape: IShape;
  debug: IDebug;
  brush: IBrush;
  connector: IConnector;
  text: IText;
  frame: IFrame;
};

export type IPhasorElementLocalRecord = {
  shape: IShapeLocalRecord;
  debug: ISurfaceElementLocalRecord;
  brush: ISurfaceElementLocalRecord;
  connector: ISurfaceElementLocalRecord;
  text: ISurfaceElementLocalRecord;
  frame: IFrameLocalRecord;
};

export const ElementCtors = {
  debug: DebugElement,
  brush: BrushElement,
  shape: ShapeElement,
  connector: ConnectorElement,
  text: TextElement,
  frame: FrameElement,
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
  frame: FrameElementDefaultProps,
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
        | 'batch'
      >
    : T extends 'frame'
    ? Omit<IPhasorElementType[T], 'id' | 'index' | 'seed' | 'rotate' | 'batch'>
    : Omit<IPhasorElementType[T], 'id' | 'index' | 'seed' | 'batch'>;

export type PhasorElementWithText = ShapeElement | TextElement;

export type { IBrush, IConnector, IDebug, IShape, IText };
