import { StrokeStyle } from '../../consts.js';
import {
  Bound,
  inflateBound,
  transformPointsToNewBound,
} from '../../utils/bound.js';
import { setLineDash } from '../../utils/canvas.js';
import { isPointIn } from '../../utils/hit-utils.js';
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
import { getConnectorPointsBound, validateConnectorProps } from './utils.js';

export class ConnectorElement extends BaseElement {
  type = 'connector' as const;
  color = '#000000';
  override x = 0;
  override y = 0;
  override w = 0;
  override h = 0;

  mode: ConnectorMode = ConnectorMode.Orthogonal;
  lineWidth = 4;
  strokeStyle: StrokeStyle = StrokeStyle.Solid;
  controllers: Controller[] = [];
  startElement?: AttachedElement;
  endElement?: AttachedElement;

  hitTest(x: number, y: number, options?: HitTestOptions) {
    return isPointIn(this, x, y);
  }

  render(ctx: CanvasRenderingContext2D) {
    const path = new Path2D();
    if (this.mode === ConnectorMode.Orthogonal) {
      drawOrthogonal(path, this.controllers);
    } else {
      drawStraight(path, this.controllers);
    }

    const last = this.controllers[this.controllers.length - 1];
    const secondToLast = this.controllers[this.controllers.length - 2];
    const arrowPath = new Path2D();
    drawArrow(arrowPath, [secondToLast.x, secondToLast.y], [last.x, last.y]);

    ctx.strokeStyle = this.transformPropertyValue(this.color);
    setLineDash(ctx, this.strokeStyle);
    ctx.lineWidth = this.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke(path);

    setLineDash(ctx, StrokeStyle.Solid);
    ctx.stroke(arrowPath);
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
      strokeStyle: this.strokeStyle,

      startElement: this.startElement,
      endElement: this.endElement,

      controllers: this.controllers,
    };
  }

  static deserialize(data: Record<string, unknown>): ConnectorElement {
    if (!validateConnectorProps(data)) {
      throw new Error('Invalid connector props');
    }
    const element = new ConnectorElement(data.id as string);
    ConnectorElement.applySerializedProps(element, data);
    return element;
  }

  static override getUpdatedSerializedProps(
    element: ConnectorElement,
    props: Partial<SerializedConnectorProps>
  ) {
    const updated = { ...props };

    const { controllers, xywh } = props;
    if (controllers?.length) {
      const lineWidth = props.lineWidth ?? element.lineWidth;
      const bound = getConnectorPointsBound(controllers);
      const boundWidthLineWidth = inflateBound(bound, lineWidth);
      const relativeControllers = controllers.map(c => {
        return {
          ...c,
          x: c.x - boundWidthLineWidth.x,
          y: c.y - boundWidthLineWidth.y,
        };
      });
      updated.controllers = relativeControllers;
      updated.xywh = boundWidthLineWidth.serialize();
    }

    if (xywh) {
      const { lineWidth } = element;
      const bound = Bound.deserialize(xywh);
      const transformed = transformPointsToNewBound(
        element.controllers,
        element,
        lineWidth / 2,
        bound,
        lineWidth / 2
      );

      updated.controllers = transformed.points;
      updated.xywh = transformed.bound.serialize();
    }

    if (props.lineWidth && props.lineWidth !== element.lineWidth) {
      const bound = updated.xywh ? Bound.deserialize(updated.xywh) : element;
      const controllers = updated.controllers ?? element.controllers;
      const transformed = transformPointsToNewBound(
        controllers,
        bound,
        element.lineWidth / 2,
        inflateBound(bound, props.lineWidth - element.lineWidth),
        props.lineWidth / 2
      );

      updated.controllers = transformed.points;
      updated.xywh = transformed.bound.serialize();
    }

    return updated;
  }

  static override applySerializedProps(
    element: ConnectorElement,
    props: Partial<SerializedConnectorProps>
  ) {
    super.applySerializedProps(element, props);
  }
}
