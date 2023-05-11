import { StrokeStyle } from '../../consts.js';
import {
  Bound,
  inflateBound,
  transformPointsToNewBound,
} from '../../utils/bound.js';
import { setLineDash } from '../../utils/canvas.js';
import { SurfaceElement } from '../base-element.js';
import { drawArrow } from './draw-arrow.js';
import { drawOrthogonal } from './draw-orthogonal.js';
import { drawStraight } from './draw-straight.js';
import type { IConnector } from './types.js';
import { ConnectorMode } from './types.js';
import { getConnectorPointsBound } from './utils.js';

export class ConnectorElement extends SurfaceElement<IConnector> {
  get mode() {
    return this.yMap.get('mode') as IConnector['mode'];
  }

  get lineWidth() {
    return this.yMap.get('lineWidth') as IConnector['lineWidth'];
  }

  get color() {
    return this.yMap.get('color') as IConnector['color'];
  }

  get strokeStyle() {
    return this.yMap.get('strokeStyle') as IConnector['strokeStyle'];
  }

  get startElement() {
    return this.yMap.get('startElement') as IConnector['startElement'];
  }

  get endElement() {
    return this.yMap.get('endElement') as IConnector['endElement'];
  }

  get controllers() {
    return this.yMap.get('controllers') as IConnector['controllers'];
  }

  override render(ctx: CanvasRenderingContext2D) {
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

  override applyUpdate(props: Partial<IConnector>) {
    const updates = { ...props };

    const { controllers, xywh } = props;
    if (controllers?.length) {
      const lineWidth = props.lineWidth ?? this.lineWidth;
      const bound = getConnectorPointsBound(controllers);
      const boundWidthLineWidth = inflateBound(bound, lineWidth);
      const relativeControllers = controllers.map(c => {
        return {
          ...c,
          x: c.x - boundWidthLineWidth.x,
          y: c.y - boundWidthLineWidth.y,
        };
      });
      updates.controllers = relativeControllers;
      updates.xywh = boundWidthLineWidth.serialize();
    }

    if (xywh) {
      const { lineWidth } = this;
      const bound = Bound.deserialize(xywh);
      const transformed = transformPointsToNewBound(
        this.controllers,
        this,
        lineWidth / 2,
        bound,
        lineWidth / 2
      );

      updates.controllers = transformed.points;
      updates.xywh = transformed.bound.serialize();
    }

    if (props.lineWidth && props.lineWidth !== this.lineWidth) {
      const bound = updates.xywh ? Bound.deserialize(updates.xywh) : this;
      const controllers = updates.controllers ?? this.controllers;
      const transformed = transformPointsToNewBound(
        controllers,
        bound,
        this.lineWidth / 2,
        inflateBound(bound, props.lineWidth - this.lineWidth),
        props.lineWidth / 2
      );

      updates.controllers = transformed.points;
      updates.xywh = transformed.bound.serialize();
    }

    for (const key in updates) {
      this.yMap.set(
        key,
        updates[key as keyof IConnector] as IConnector[keyof IConnector]
      );
    }
  }
}
