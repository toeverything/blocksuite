import type { RoughCanvas } from 'roughjs/bin/canvas.js';

import type { IBound, StrokeStyle } from '../../consts.js';
import type { SerializedXYWH } from '../../utils/xywh.js';
import type { HitTestOptions } from '../surface-element.js';
import type { ShapeElement } from './shape-element.js';

export type ShapeType = 'rect' | 'triangle' | 'ellipse' | 'diamond';

export interface IShape {
  id: string;
  index: string;
  type: 'shape';
  xywh: SerializedXYWH;
  seed: number;

  shapeType: ShapeType;
  radius: number;
  filled: boolean;
  fillColor: string;
  strokeWidth: number;
  strokeColor: string;
  strokeStyle: StrokeStyle;

  textId?: string;
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
    bound: IBound,
    options?: HitTestOptions
  ) => boolean;
}
