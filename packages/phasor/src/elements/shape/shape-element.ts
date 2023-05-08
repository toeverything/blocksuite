import { StrokeStyle } from '../../consts.js';
import { BaseElement, type HitTestOptions } from '../base-element.js';
import { ShapeMethodsMap } from './shapes/index.js';
import type { SerializedShapeProps, ShapeType } from './types.js';
import { validateShapeProps } from './utils.js';

export class ShapeElement extends BaseElement {
  type = 'shape' as const;
  shapeType: ShapeType = 'rect';
  radius = 0;
  filled = false;
  fillColor = '#ffffff';
  strokeWidth = 4;
  strokeColor = '#000000';
  strokeStyle: StrokeStyle = StrokeStyle.Solid;

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
    if (!validateShapeProps(data)) {
      throw new Error('Invalid shape props');
    }
    const element = new ShapeElement(data.id);
    ShapeElement.applySerializedProps(element, data);
    return element;
  }

  static override applySerializedProps(
    element: ShapeElement,
    props: Partial<SerializedShapeProps>
  ) {
    super.applySerializedProps(element, props);
  }

  static override getUpdatedSerializedProps(
    element: ShapeElement,
    props: Partial<SerializedShapeProps>
  ) {
    return props;
  }
}
