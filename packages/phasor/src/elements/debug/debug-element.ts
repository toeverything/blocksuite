import { isPointIn } from '../../utils/hit-utils.js';
import { serializeXYWH } from '../../utils/xywh.js';
import { BaseElement, type HitTestOptions } from '../base-element.js';

export type SerializedDebugProps = {
  id: string;
  index: string;
  type: 'debug';
  xywh: string;
  color: string;
};

export type CreateDebugProps = Omit<
  SerializedDebugProps,
  'id' | 'index' | 'type'
>;

export class DebugElement extends BaseElement {
  type = 'debug' as const;
  color = '#000000';

  hitTest(x: number, y: number, options?: HitTestOptions) {
    return isPointIn(this, x, y);
  }

  serialize(): SerializedDebugProps {
    return {
      id: this.id,
      index: this.index,
      type: this.type,
      xywh: serializeXYWH(this.x, this.y, this.w, this.h),
      color: this.color,
    };
  }

  static deserialize(data: Record<string, unknown>): DebugElement {
    const element = new DebugElement(data.id as string);
    DebugElement.applySerializedProps(element, data);
    return element;
  }

  static override applySerializedProps(
    element: DebugElement,
    props: Partial<SerializedDebugProps>
  ) {
    super.applySerializedProps(element, props);
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, this.w, this.h);
  }
}
