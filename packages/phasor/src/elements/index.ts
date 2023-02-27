import type { BrushElement } from './brush/brush-element.js';
import type { DebugElement } from './debug/debug-element.js';
import type { ShapeElement } from './shape/shape-element.js';

export type { SurfaceElement } from './base-element.js';
export {
  BrushElement,
  getBrushBoundFromPoints,
} from './brush/brush-element.js';
export { DebugElement } from './debug/debug-element.js';
export { ShapeElement } from './shape/shape-element.js';
export type { ShapeProps, ShapeType } from './shape/types.js';

export type PhasorElement = ShapeElement | DebugElement | BrushElement;

export type PhasorElementType = PhasorElement['type'];
