import type { Color, IBound, StrokeStyle } from '../../consts.js';
import type { HitTestOptions } from '../base-element.js';
import type { ShapeElement } from './shape-element.js';

export type ShapeType = 'rect' | 'triangle' | 'ellipse' | 'diamond';

export type SerializedShapeProps = {
  id: string;
  index: string;
  type: string;
  xywh: string;

  shapeType: ShapeType;
  radius: number;
  filled: boolean;
  fillColor: Color;
  strokeWidth: number;
  strokeColor: Color;
  strokeStyle: StrokeStyle;
};

type ShapeKeys = keyof Omit<SerializedShapeProps, 'id' | 'type' | 'xywh'>;

export type ShapeProps = Partial<Pick<SerializedShapeProps, ShapeKeys>>;

export interface ShapeMethods {
  render: (ctx: CanvasRenderingContext2D, element: ShapeElement) => void;
  hitTestPoint: (
    x: number,
    y: number,
    bound: IBound,
    options?: HitTestOptions
  ) => boolean;
  hitTestBound?: (
    shapeBound: IBound,
    area: IBound,
    options?: HitTestOptions
  ) => boolean;
}
