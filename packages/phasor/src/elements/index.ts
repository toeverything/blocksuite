import type { DebugElement } from './debug/debug-element.js';
import type { ShapeElement } from './shape/shape-element.js';

export type { SurfaceElement } from './base-element.js';
export { DebugElement } from './debug/debug-element.js';
export { ShapeElement, type ShapeType } from './shape/shape-element.js';

export type PhasorElement = ShapeElement | DebugElement;

export type PhasorElementType = PhasorElement['type'];
