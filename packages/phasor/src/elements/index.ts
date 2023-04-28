import { BrushElement } from './brush/brush-element.js';
import type { CreateBrushProps, SerializedBrushProps } from './brush/types.js';
import { ConnectorElement } from './connector/connector-element.js';
import type {
  CreateConnectorProps,
  SerializedConnectorProps,
} from './connector/types.js';
import {
  type CreateDebugProps,
  DebugElement,
  type SerializedDebugProps,
} from './debug/debug-element.js';
import { ShapeElement } from './shape/shape-element.js';
import type { CreateShapeProps, SerializedShapeProps } from './shape/types.js';

export type { SurfaceElement } from './base-element.js';
export {
  BrushElement,
  getBrushBoundFromPoints,
} from './brush/brush-element.js';
export { ConnectorElement } from './connector/connector-element.js';
export { DebugElement } from './debug/debug-element.js';
export { ShapeElement } from './shape/shape-element.js';
export type { ShapeProps, ShapeType } from './shape/types.js';

export type PhasorElement =
  | ShapeElement
  | DebugElement
  | BrushElement
  | ConnectorElement;

export type PhasorElementType = PhasorElement['type'];
export type PhasorElementSerializeProps =
  | SerializedBrushProps
  | SerializedConnectorProps
  | SerializedShapeProps
  | SerializedDebugProps;
export type PhasorElementCreateProps =
  | CreateBrushProps
  | CreateConnectorProps
  | CreateShapeProps
  | CreateDebugProps;

export const ElementCtors = {
  debug: DebugElement,
  brush: BrushElement,
  shape: ShapeElement,
  connector: ConnectorElement,
} as const;
