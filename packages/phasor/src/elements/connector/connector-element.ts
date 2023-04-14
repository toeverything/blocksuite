import type { IBound } from '../../consts.js';
import { isPointIn } from '../../utils/hit-utils.js';
import { simplePick } from '../../utils/std.js';
import { deserializeXYWH, serializeXYWH, setXYWH } from '../../utils/xywh.js';
import { BaseElement, type HitTestOptions } from '../base-element.js';
import { drawArrow } from './draw-arrow.js';
import { drawOrthogonal } from './draw-orthogonal.js';
import { drawStraight } from './draw-straight.js';
import type {
  AttachedElement,
  Controller,
  SerializedConnectorProps,
} from './types.js';
import { ConnectorMode } from './types.js';

export class ConnectorElement extends BaseElement {
  type = 'connector' as const;
  color = '#000000' as const;
  override x = 0;
  override y = 0;
  override w = 0;
  override h = 0;

  mode: ConnectorMode = ConnectorMode.Orthogonal;
  lineWidth = 2;
  controllers: Controller[] = [];
  startElement?: AttachedElement;
  endElement?: AttachedElement;

  hitTest(x: number, y: number, options?: HitTestOptions) {
    return isPointIn(this, x, y);
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.translate(this.lineWidth / 2, this.lineWidth / 2);

    const path = new Path2D();
    if (this.mode === ConnectorMode.Orthogonal) {
      drawOrthogonal(path, this.controllers);
    } else {
      drawStraight(path, this.controllers);
    }

    const last = this.controllers[this.controllers.length - 1];
    const secondToLast = this.controllers[this.controllers.length - 2];
    drawArrow(path, [secondToLast.x, secondToLast.y], [last.x, last.y]);

    ctx.strokeStyle = this.transformPropertyValue(this.color);
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

      mode: this.mode,
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

    const { controllers, startElement, endElement, mode, color } =
      ConnectorElement.getProps(element, data) as SerializedConnectorProps;
    ConnectorElement.updateProps(element, {
      controllers: controllers?.length ? JSON.parse(controllers) : [],
      startElement,
      endElement,
      mode,
      color,
    });

    return element;
  }

  static updateProps(
    element: ConnectorElement,
    props: Record<string, unknown>
  ) {
    Object.assign(element, props);
  }

  static override getProps(
    element: BaseElement,
    rawProps: Record<string, unknown>
  ) {
    const props = simplePick(rawProps, [
      'index',
      'mode',
      'color',
      'lineWidth',
      'xywh',
      'controllers',
      'startElement',
      'endElement',
    ]);

    return props;
  }

  static override getBoundProps(
    element: BaseElement,
    bound: IBound
  ): Record<string, string> {
    const elementH = Math.max(element.h, 1);
    const elementW = Math.max(element.w, 1);
    const boundH = Math.max(bound.h, 1);
    const boundW = Math.max(bound.w, 1);
    const controllers = (element as ConnectorElement).controllers.map(v => {
      return {
        ...v,
        x: boundW * (v.x / elementW),
        y: boundH * (v.y / elementH),
      };
    });

    return {
      xywh: serializeXYWH(bound.x, bound.y, boundW, boundH),
      controllers: JSON.stringify(controllers),
    };
  }
}
