import type { Color, StrokeStyle } from '../../consts.js';
import { deserializeXYWH, setXYWH } from '../../utils/xywh.js';
import { BaseElement, HitTestOptions } from '../base-element.js';
import { ShapeMethodsMap } from './shapes/index.js';
import type { SerializedShapeProps, ShapeProps, ShapeType } from './types.js';

export class ShapeElement extends BaseElement {
  type = 'shape' as const;
  shapeType: ShapeType;
  radius = 0;
  filled = false;
  fillColor: Color = '#ffffff';
  strokeWidth = 4;
  strokeColor: Color = '#000000';
  strokeStyle: StrokeStyle = 'solid';

  constructor(id: string, shapeType: ShapeType) {
    super(id);
    this.shapeType = shapeType;
  }

  hitTest(x: number, y: number, options?: HitTestOptions) {
    const { hitTest } = ShapeMethodsMap[this.shapeType];
    return hitTest(x, y, this, options);
  }

  serialize(): SerializedShapeProps {
    return {
      id: this.id,
      index: this.index,
      type: this.type,
      xywh: this._xywh,

      shapeType: this.shapeType,

      radius: this.radius,
      filled: this.filled,
      fillColor: this.fillColor,
      strokeWidth: this.strokeWidth,
      strokeColor: this.strokeColor,
      strokeStyle: this.strokeStyle,
    };
  }

  static deserialize(data: Record<string, unknown>): ShapeElement {
    const shapeType = data.shapeType as ShapeType;
    const element = new ShapeElement(data.id as string, shapeType);

    const [x, y, w, h] = deserializeXYWH(data.xywh as string);
    setXYWH(element, { x, y, w, h });

    const { id, type, xywh, ...props } = data as SerializedShapeProps;
    ShapeElement.updateProps(element, props);

    return element;
  }

  static updateProps(element: ShapeElement, props: ShapeProps) {
    Object.assign(element, props);
  }

  render(ctx: CanvasRenderingContext2D) {
    const { render } = ShapeMethodsMap[this.shapeType];
    render(ctx, this);
  }
}
