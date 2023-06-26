import type { RoughCanvas } from 'roughjs/bin/canvas.js';

import type { IBound, StrokeStyle } from '../../consts.js';
import type { IVec } from '../../utils/vec.js';
import type { HitTestOptions, ISurfaceElement } from '../surface-element.js';
import type { ShapeElement } from './shape-element.js';

export type ShapeType = 'rect' | 'triangle' | 'ellipse' | 'diamond';

export interface IShape extends ISurfaceElement {
  type: 'shape';
  shapeType: ShapeType;
  radius: number;
  filled: boolean;
  fillColor: string;
  strokeWidth: number;
  strokeColor: string;
  strokeStyle: StrokeStyle;
  // https://github.com/rough-stuff/rough/wiki#roughness
  roughness?: number;
}

export interface ShapeMethods {
  render: (
    ctx: CanvasRenderingContext2D,
    rc: RoughCanvas,
    element: ShapeElement
  ) => void;
  hitTest: (
    x: number,
    y: number,
    element: ShapeElement,
    options?: HitTestOptions
  ) => boolean;
  intersectWithLine: (start: IVec, end: IVec, element: ShapeElement) => boolean;
}
