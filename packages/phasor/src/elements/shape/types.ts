import type { RoughCanvas } from 'roughjs/bin/canvas.js';
import type * as Y from 'yjs';

import type { IBound, StrokeStyle } from '../../consts.js';
import type { SerializedXYWH } from '../../utils/xywh.js';
import type { HitTestOptions } from '../surface-element.js';
import type { SHAPE_TEXT_FONT_SIZE } from './constants.js';
import type { ShapeElement } from './shape-element.js';

export type ShapeType = 'rect' | 'triangle' | 'ellipse' | 'diamond';

export interface IShape {
  id: string;
  type: 'shape';
  xywh: SerializedXYWH;
  index: string;
  seed: number;

  shapeType: ShapeType;
  radius: number;
  filled: boolean;
  fillColor: string;
  strokeWidth: number;
  strokeColor: string;
  strokeStyle: StrokeStyle;
  // https://github.com/rough-stuff/rough/wiki#roughness
  roughness?: number;

  text?: Y.Text;
  color?: string;
  fontSize?: SHAPE_TEXT_FONT_SIZE;
  fontFamily?: string;
  textHorizontalAlign?: 'top' | 'center' | 'bottom';
  textVerticalAlign?: 'left' | 'center' | 'right';
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
