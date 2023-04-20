// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { getStrokePoints } from 'perfect-freehand/dist/esm/index.js';

import type { IBound } from '../../consts.js';
import { isPointIn } from '../../utils/hit-utils.js';
import { simplePick } from '../../utils/std.js';
import { Utils } from '../../utils/tl-utils.js';
import { deserializeXYWH, serializeXYWH, setXYWH } from '../../utils/xywh.js';
import { BaseElement, type HitTestOptions } from '../base-element.js';
import type { BrushProps, SerializedBrushProps } from './types.js';

function getSolidStrokePoints(points: number[][], lineWidth: number) {
  return getStrokePoints(points, {
    size: lineWidth,
    thinning: 0.65,
    streamline: 0.65,
    smoothing: 0.65,
    easing: t => Math.sin((t * Math.PI) / 2),
    simulatePressure: true,
  });
}

export function getBrushBoundFromPoints(
  points: number[][],
  lineWidth: number
): IBound {
  const { minX, minY, width, height } = Utils.getBoundsFromPoints(points);
  return {
    x: minX - lineWidth / 2,
    y: minY - lineWidth / 2,
    w: width < lineWidth ? lineWidth : width + lineWidth,
    h: height < lineWidth ? lineWidth : height + lineWidth,
  };
}

export class BrushElement extends BaseElement {
  type = 'brush' as const;
  color = '#000000';
  override x = 0;
  override y = 0;
  override w = 0;
  override h = 0;

  /* Brush mouse coords relative to left-top corner */
  points: number[][] = [];
  lineWidth = 4;

  hitTest(x: number, y: number, options?: HitTestOptions) {
    return isPointIn(this, x, y);
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.translate(this.lineWidth / 2, this.lineWidth / 2);

    // render stroke points
    const stroke = getSolidStrokePoints(this.points, this.lineWidth);
    const commands = Utils.getSvgPathFromStrokePoints(stroke);
    const path = new Path2D(commands);

    ctx.strokeStyle = this.transformPropertyValue(this.color);
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(path);
  }

  serialize(): SerializedBrushProps {
    return {
      id: this.id,
      index: this.index,
      type: this.type,
      xywh: this._xywh,

      color: this.color,
      lineWidth: this.lineWidth,
      points: JSON.stringify(this.points),
    };
  }

  static deserialize(data: Record<string, unknown>): BrushElement {
    const element = new BrushElement(data.id as string);

    const [x, y, w, h] = deserializeXYWH(data.xywh as string);
    setXYWH(element, { x, y, w, h });
    element.points = JSON.parse(data.points as string);

    const { xywh, ...props } = BrushElement.getProps(element, data);
    BrushElement.updateProps(element, props);

    return element;
  }

  static updateProps(element: BrushElement, props: BrushProps) {
    Object.assign(element, props);
  }

  static override getBoundProps(
    element: BaseElement,
    bound: IBound
  ): Record<string, string> {
    const { lineWidth } = element as BrushElement;
    const elementH = Math.max(element.h - lineWidth, 1);
    const elementW = Math.max(element.w - lineWidth, 1);
    const boundH = Math.max(bound.h - lineWidth, 1);
    const boundW = Math.max(bound.w - lineWidth, 1);
    const points = (element as BrushElement).points.map(([x, y]) => {
      return [boundW * (x / elementW), boundH * (y / elementH)];
    });

    return {
      xywh: serializeXYWH(
        bound.x,
        bound.y,
        boundW + lineWidth,
        boundH + lineWidth
      ),
      points: JSON.stringify(points),
    };
  }

  static override getProps(
    element: BaseElement,
    rawProps: BrushProps & { xywh?: string }
  ): BrushProps & { xywh?: string } {
    const props = simplePick(rawProps, ['index', 'color', 'lineWidth', 'xywh']);

    if (props.lineWidth) {
      const { x, y, w, h } = element;
      const d = props.lineWidth - (element as BrushElement).lineWidth;
      props.xywh = serializeXYWH(x, y, w + d, h + d);
    }

    return props;
  }
}
