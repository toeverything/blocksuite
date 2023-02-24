import type { Color, StrokeStyle } from '../../consts.js';
import { deserializeXYWH } from '../../utils/xywh.js';
import { BaseElement, HitTestOptions } from '../base-element.js';
import { getShapeUtils } from './shape-utils/get-shape-utils.js';
import type { MutableProperties, SerializedShape, ShapeType } from './types.js';

export class ShapeElement extends BaseElement {
  type = 'shape' as const;

  shapeType: ShapeType;

  rounded = false;
  filled = false;
  fillColor: Color = '#ffffff';
  strokeWidth = 4;
  strokeColor: Color = '#000000';
  strokeStyle: StrokeStyle = 'solid';

  constructor(id: string, shapeType: ShapeType) {
    super(id);
    this.shapeType = shapeType;
  }

  updateProperties(properties: MutableProperties) {
    Object.assign(this, properties);
  }

  hitTest(x: number, y: number, options?: HitTestOptions) {
    const shapeUtils = getShapeUtils(this.shapeType);
    return shapeUtils.hitTest([x, y], this, options);
  }

  render(ctx: CanvasRenderingContext2D) {
    const shapeUtils = getShapeUtils(this.shapeType);
    shapeUtils.render(ctx, {
      width: this.w,
      height: this.h,
      rounded: this.rounded,
      filled: this.filled,
      fillColor: this.fillColor,
      strokeWidth: this.strokeWidth,
      strokeColor: this.strokeColor,
      strokeStyle: this.strokeStyle,
    });
  }

  serialize(): SerializedShape {
    return {
      id: this.id,
      index: this.index,
      type: this.type,
      xywh: this.xywh,

      shapeType: this.shapeType,

      rounded: this.rounded,
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
    element.setBound(x, y, w, h);
    const { id, type, xywh, ...properties } = data as SerializedShape;
    element.updateProperties(properties);

    return element;
  }
}
