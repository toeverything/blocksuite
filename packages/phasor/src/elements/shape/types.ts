import type { Color, IBound, StrokeStyle } from '../../consts.js';
import type { HitTestOptions } from '../base-element.js';

export type ShapeType = 'rect' | 'triangle' | 'ellipse' | 'diamond';

export interface ShapeRenderConfig {
  width: number;
  height: number;

  // rect shape support only
  rounded?: boolean;
  filled?: boolean;
  fillColor: Color;
  strokeWidth: number;
  strokeColor: Color;
  // TODO: no shape support
  strokeStyle: StrokeStyle;
}

export type SerializedShapeProps = {
  id: string;
  index: string;
  type: string;
  xywh: string;

  shapeType: ShapeType;
  rounded: boolean;
  filled: boolean;
  fillColor: Color;
  strokeWidth: number;
  strokeColor: Color;
  strokeStyle: StrokeStyle;
};

export type MutableShapeKeys = keyof Omit<
  SerializedShapeProps,
  'id' | 'type' | 'xywh'
>;

export type ShapeProps = Partial<Pick<SerializedShapeProps, MutableShapeKeys>>;

export interface ShapeUtils {
  render: (ctx: CanvasRenderingContext2D, config: ShapeRenderConfig) => void;
  hitTest: (
    point: [number, number],
    bound: IBound,
    options?: HitTestOptions
  ) => boolean;
}
