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

export type SerializedShape = {
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

export type MutablePropertyKeys = keyof Omit<
  SerializedShape,
  'id' | 'type' | 'xywh'
>;

export type MutableProperties = Partial<
  Pick<SerializedShape, MutablePropertyKeys>
>;

export interface ShapeUtils {
  render: (ctx: CanvasRenderingContext2D, config: ShapeRenderConfig) => void;
  hitTest: (
    point: [number, number],
    bound: IBound,
    options?: HitTestOptions
  ) => boolean;
}
