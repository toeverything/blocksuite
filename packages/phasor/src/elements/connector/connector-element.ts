import type { IBound } from '../../consts.js';
import { isPointIn } from '../../utils/hit-utils.js';
import { simplePick } from '../../utils/std.js';
import { deserializeXYWH, serializeXYWH, setXYWH } from '../../utils/xywh.js';
import { BaseElement, type HitTestOptions } from '../base-element.js';
import type { AttachedElement, SerializedConnectorProps } from './types.js';

/* "magic number" for bezier approximations of arcs (http://itc.ktu.lt/itc354/Riskus354.pdf) */
const kRect = 1 - 0.5522847498;
const RADIUS = 10;

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

  lineWidth = 2;
  // relative to element x,y.
  // [x0, y0, x1, y1, x2, y2...]
  controllers: number[] = [];
  startElement?: AttachedElement;
  endElement?: AttachedElement;

  hitTest(x: number, y: number, options?: HitTestOptions) {
    return isPointIn(this, x, y);
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.translate(this.lineWidth / 2, this.lineWidth / 2);

    const path = new Path2D();
    path.moveTo(this.controllers[0], this.controllers[1]);
    let lastX = this.controllers[0];
    let lastY = this.controllers[1];
    for (let i = 2; i < this.controllers.length - 2; i = i + 2) {
      const currentX = this.controllers[i];
      const currentY = this.controllers[i + 1];
      const nextX = this.controllers[i + 2];
      const nextY = this.controllers[i + 3];

      const minX = Math.min(lastX, nextX);
      const minY = Math.min(lastY, nextY);
      const maxX = Math.max(lastX, nextX);
      const maxY = Math.max(lastY, nextY);
      const radius = Math.min(RADIUS, (maxX - minX) / 2, (maxY - minY) / 2);

      // current is right-bottom conner
      if (currentX === maxX && currentY === maxY) {
        if (lastX === currentX) {
          path.lineTo(currentX, currentY - radius);
          path.bezierCurveTo(
            currentX,
            currentY - kRect * radius,
            currentX - kRect * radius,
            currentY,
            currentX - radius,
            currentY
          );
        } else {
          path.lineTo(currentX - radius, currentY);
          path.bezierCurveTo(
            currentX - kRect * radius,
            currentY,
            currentX,
            currentY - kRect * radius,
            currentX,
            currentY - radius
          );
        }
      }
      // current is left-bottom conner
      else if (currentX === minX && currentY === maxY) {
        if (lastX === currentX) {
          path.lineTo(currentX, currentY - radius);
          path.bezierCurveTo(
            currentX,
            currentY - kRect * radius,
            currentX + kRect * radius,
            currentY,
            currentX + radius,
            currentY
          );
        } else {
          path.lineTo(currentX + radius, currentY);
          path.bezierCurveTo(
            currentX + kRect * radius,
            currentY,
            currentX,
            currentY - kRect * radius,
            currentX,
            currentY - radius
          );
        }
      }
      // current is left-top conner
      else if (currentX === minX && currentY === minY) {
        if (lastX === currentX) {
          path.lineTo(currentX, currentY + radius);
          path.bezierCurveTo(
            currentX,
            currentY + kRect * radius,
            currentX + kRect * radius,
            currentY,
            currentX + radius,
            currentY
          );
        } else {
          path.lineTo(currentX + radius, currentY);
          path.bezierCurveTo(
            currentX + kRect * radius,
            currentY,
            currentX,
            currentY + kRect * radius,
            currentX,
            currentY + radius
          );
        }
      }
      // current is right-top conner
      else if (currentX === maxX && currentY === minY) {
        if (lastX === currentX) {
          path.lineTo(currentX, currentY + radius);
          path.bezierCurveTo(
            currentX,
            currentY + kRect * radius,
            currentX - kRect * radius,
            currentY,
            currentX - radius,
            currentY
          );
        } else {
          path.lineTo(currentX - radius, currentY);
          path.bezierCurveTo(
            currentX - kRect * radius,
            currentY,
            currentX,
            currentY + kRect * radius,
            currentX,
            currentY + radius
          );
        }
      }

      lastX = currentX;
      lastY = currentY;
    }
    path.lineTo(...(this.controllers.slice(-2) as [number, number]));

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

      startElement: this.startElement,
      endElement: this.endElement,

      controllers: JSON.stringify(this.controllers),
    };
  }

  static deserialize(data: Record<string, unknown>): ConnectorElement {
    const element = new ConnectorElement(data.id as string);

    const [x, y, w, h] = deserializeXYWH(data.xywh as string);
    setXYWH(element, { x, y, w, h });

    const { controllers, startElement, endElement } = ConnectorElement.getProps(
      element,
      data
    ) as SerializedConnectorProps;
    ConnectorElement.updateProps(element, {
      controllers: controllers?.length ? JSON.parse(controllers) : [],
      startElement,
      endElement,
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
      'startElement',
      'endElement',
    ]);

    return props;
  }

  static getBoundProps(
    element: BaseElement,
    bound: IBound
  ): Record<string, string> {
    const elementH = Math.max(element.h, 1);
    const elementW = Math.max(element.w, 1);
    const boundH = Math.max(bound.h, 1);
    const boundW = Math.max(bound.w, 1);
    const controllers = (element as ConnectorElement).controllers.map(
      (v, index) => {
        return index % 2 ? boundH * (v / elementH) : boundW * (v / elementW);
      }
    );

    return {
      xywh: serializeXYWH(bound.x, bound.y, boundW, boundH),
      controllers: JSON.stringify(controllers),
    };
  }
}
