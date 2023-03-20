import { isPointIn } from '../../utils/hit-utils.js';
import { simplePick } from '../../utils/std.js';
import { deserializeXYWH, setXYWH } from '../../utils/xywh.js';
import { BaseElement, type HitTestOptions } from '../base-element.js';
import type { SerializedConnectorProps } from './types.js';

function drawArrow(
  path: Path2D,
  [startX, startY]: number[],
  [endX, endY]: number[]
) {
  const angle = (Math.atan2(startY - endY, startX - endX) * 180) / Math.PI;
  const ptAngle = ((angle + 40) * Math.PI) / 180;
  const pt = [endX + Math.cos(ptAngle) * 10, endY + Math.sin(ptAngle) * 10];

  const pbAngle = ((angle - 40) * Math.PI) / 180;
  const pb = [endX + Math.cos(pbAngle) * 10, endY + Math.sin(pbAngle) * 10];

  path.moveTo(endX, endY);
  path.lineTo(pt[0], pt[1]);
  path.moveTo(endX, endY);
  path.lineTo(pb[0], pb[1]);
}

export class ConnectorElement extends BaseElement {
  type = 'connector' as const;
  color = '#000000' as const;
  x = 0;
  y = 0;
  w = 0;
  h = 0;

  lineWidth = 4;
  // relative to element x,y.
  // [x0, y0, x1, y1, x2, y2...]
  controllers: number[] = [];

  hitTest(x: number, y: number, options?: HitTestOptions) {
    return isPointIn(this, x, y);
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.translate(this.lineWidth / 2, this.lineWidth / 2);

    const path = new Path2D();
    path.moveTo(this.controllers[0], this.controllers[1]);
    for (let i = 2; i < this.controllers.length; i = i + 2) {
      path.lineTo(this.controllers[i], this.controllers[i + 1]);
    }

    drawArrow(path, this.controllers.slice(-4, -2), this.controllers.slice(-2));

    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(path);
  }

  serialize(): SerializedConnectorProps {
    return {
      id: this.id,
      index: this.index,
      type: this.type,
      xywh: this._xywh,

      color: this.color,
      lineWidth: this.lineWidth,

      controllers: JSON.stringify(this.controllers),
    };
  }

  static deserialize(data: Record<string, unknown>): ConnectorElement {
    const element = new ConnectorElement(data.id as string);

    const [x, y, w, h] = deserializeXYWH(data.xywh as string);
    setXYWH(element, { x, y, w, h });

    const { controllers } = ConnectorElement.getProps(
      element,
      data
    ) as SerializedConnectorProps;
    ConnectorElement.updateProps(element, {
      controllers: controllers?.length ? JSON.parse(controllers) : [],
    });

    return element;
  }

  static updateProps(
    element: ConnectorElement,
    props: Record<string, unknown>
  ) {
    Object.assign(element, props);
  }

  static getProps(element: BaseElement, rawProps: Record<string, unknown>) {
    const props = simplePick(rawProps, [
      'index',
      'color',
      'lineWidth',
      'xywh',
      'controllers',
    ]);

    return props;
  }
}
