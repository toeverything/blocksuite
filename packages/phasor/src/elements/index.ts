import type { SurfaceElement } from '../index.js';
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
import type { IShape } from './shape/types.js';
import { TextElementDefaultProps } from './text/constants.js';
import { TextElement } from './text/text-element.js';
import type { IText } from './text/types.js';

export { BrushElement } from './brush/brush-element.js';
export { ConnectorElement } from './connector/connector-element.js';
export { DebugElement } from './debug/debug-element.js';
export { ShapeElement } from './shape/shape-element.js';
export type { ShapeType } from './shape/types.js';
export type { SurfaceElement } from './surface-element.js';

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

export const ElementCtors = {
  debug: DebugElement,
  brush: BrushElement,
  shape: ShapeElement,
  connector: ConnectorElement,
  text: TextElement,
} as const;

export const ElementDefaultProps: Record<
  keyof IPhasorElementType,
  ElementDefaultProps<keyof IPhasorElementType>
> = {
  debug: DebugElementDefaultProps,
  brush: BrushElementDefaultProps,
  shape: ShapeElementDefaultProps,
  connector: ConnectorElementDefaultProps,
  text: TextElementDefaultProps,
} as const;

export type ElementCreateProps<T extends keyof IPhasorElementType> = Partial<
  Omit<IPhasorElementType[T], 'id' | 'index' | 'seed'>
>;

export type ElementDefaultProps<T extends keyof IPhasorElementType> = Omit<
  IPhasorElementType[T],
  'id' | 'index' | 'seed'
>;
