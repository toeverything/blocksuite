import { deserializeXYWH, serializeXYWH } from '../../utils/xywh.js';
import { BaseElement, HitTestOptions } from '../base-element.js';
import { getShapeUtils } from './shape-utils/get-shape-utils.js';
import type { RenderSequenceItem, ShapeType } from './types.js';

export class ShapeElement extends BaseElement {
  type = 'shape' as const;
  shapeType: ShapeType;
  color: `#${string}` = '#000000';

  private _renderSequence: RenderSequenceItem[] = [];

  constructor(id: string, shapeType: ShapeType) {
    super(id);
    this.shapeType = shapeType;
  }

  setBound(x: number, y: number, w: number, h: number): void {
    super.setBound(x, y, w, h);

    const shapeUtils = getShapeUtils(this.shapeType);
    this._renderSequence = shapeUtils.createRenderSequence({
      width: this.w,
      height: this.h,
      fillColor: undefined,
      strokeWidth: 4,
      strokeColor: '#000',
      strokeStyle: 'solid',
    });
  }

  hitTest(x: number, y: number, options?: HitTestOptions) {
    const shapeUtils = getShapeUtils(this.shapeType);
    return shapeUtils.hitTest([x, y], this, options);
  }

  render(ctx: CanvasRenderingContext2D) {
    this._renderSequence.forEach(seq => {
      ctx.save();
      if (seq.type === 'fill') {
        ctx.fillStyle = seq.color;
        ctx.fill(seq.path2d);
      } else if (seq.type === 'stroke') {
        ctx.strokeStyle = seq.color ?? '#000';
        ctx.lineWidth = seq.width;
        ctx.stroke(seq.path2d);
      }
      ctx.restore();
    });
  }

  serialize(): Record<string, unknown> {
    return {
      id: this.id,
      index: this.index,
      type: this.type,
      shapeType: this.shapeType,
      xywh: serializeXYWH(this.x, this.y, this.w, this.h),
      color: this.color,
    };
  }

  static deserialize(data: Record<string, unknown>): ShapeElement {
    const shapeType = data.shapeType as ShapeType;
    const element = new ShapeElement(data.id as string, shapeType);
    element.index = data.index as string;

    const [x, y, w, h] = deserializeXYWH(data.xywh as string);
    element.setBound(x, y, w, h);
    element.color = data.color as `#${string}`;
    return element;
  }
}
