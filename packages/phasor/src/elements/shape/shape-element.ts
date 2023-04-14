import type { StrokeStyle } from '../../consts.js';
import { simplePick } from '../../utils/std.js';
import { deserializeXYWH, setXYWH } from '../../utils/xywh.js';
import { BaseElement, type HitTestOptions } from '../base-element.js';
import { ShapeMethodsMap } from './shapes/index.js';
import type { SerializedShapeProps, ShapeProps, ShapeType } from './types.js';

export class ShapeElement extends BaseElement {
  type = 'shape' as const;
  shapeType: ShapeType;
  radius = 0;
  filled = false;
  fillColor = '#ffffff';
  strokeWidth = 4;
  strokeColor = '#000000';
  strokeStyle: StrokeStyle = 'solid';

  constructor(id: string, shapeType: ShapeType) {
    super(id);
    this.shapeType = shapeType;
  }

  get realStrokeColor() {
    return this.transformPropertyValue(this.strokeColor);
  }

  get realFillColor() {
    return this.transformPropertyValue(this.fillColor);
  }

  hitTest(x: number, y: number, options?: HitTestOptions) {
    const { hitTest } = ShapeMethodsMap[this.shapeType];
    return hitTest(x, y, this, options);
  }

  render(ctx: CanvasRenderingContext2D) {
    const { render } = ShapeMethodsMap[this.shapeType];
    render(ctx, this);
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

    const props = ShapeElement.getProps(element, data);
    ShapeElement.updateProps(element, props);

    return element;
  }

  static updateProps(element: ShapeElement, props: ShapeProps) {
    Object.assign(element, props);
  }

  static override getProps(_: BaseElement, rawProps: ShapeProps): ShapeProps {
    return simplePick(rawProps, [
      'shapeType',
      'index',
      'radius',
      'filled',
      'fillColor',
      'strokeColor',
      'strokeWidth',
      'strokeStyle',
    ]);
  }
}
