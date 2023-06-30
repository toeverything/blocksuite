import { DEFAULT_ROUGHNESS, StrokeStyle } from '../../consts.js';
import type { RoughCanvas } from '../../rough/canvas.js';
import {
  Bound,
  inflateBound,
  transformPointsToNewBound,
} from '../../utils/bound.js';
import { linePolylineIntersects } from '../../utils/math-utils.js';
import { type IVec } from '../../utils/vec.js';
import { SurfaceElement } from '../surface-element.js';
import type { IConnector } from './types.js';
import { ConnectorMode } from './types.js';
import { getArrowPoints, getConnectorPointsBound } from './utils.js';

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

  get roughness() {
    return (
      (this.yMap.get('roughness') as IConnector['roughness']) ??
      DEFAULT_ROUGHNESS
    );
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

  override containedByBounds(bounds: Bound) {
    return false;
  }

  override intersectWithLine(start: IVec, end: IVec): boolean {
    const bound = Bound.deserialize(this.xywh);
    return !!linePolylineIntersects(
      start,
      end,
      this.controllers.map(c => [c.x + bound.x, c.y + bound.y])
    );
  }

  override render(
    ctx: CanvasRenderingContext2D,
    matrix: DOMMatrix,
    rc: RoughCanvas
  ) {
    const {
      seed,
      strokeStyle,
      color,
      roughness,
      lineWidth,
      controllers,
      mode,
      // rotate
    } = this;
    // const [, , w, h] = this.deserializeXYWH();
    // const cx = w / 2;
    // const cy = h / 2;

    ctx.setTransform(
      matrix
      // .translateSelf(cx, cy)
      // .multiplySelf(new DOMMatrix(localMatrix))
      // .translateSelf(-cx, -cy)
    );

    const realStrokeColor = this.computedValue(color);

    if (mode === ConnectorMode.Orthogonal) {
      rc.linearPath(
        controllers.map(controller => [controller.x, controller.y]),
        {
          seed,
          roughness,
          strokeLineDash:
            strokeStyle === StrokeStyle.Dashed ? [12, 12] : undefined,
          stroke: realStrokeColor,
          strokeWidth: lineWidth,
        }
      );
    } else {
      rc.linearPath(
        [
          [controllers[0].x, controllers[0].y],
          [
            controllers[controllers.length - 1].x,
            controllers[controllers.length - 1].y,
          ],
        ],
        {
          seed,
          roughness,
          strokeLineDash:
            strokeStyle === StrokeStyle.Dashed ? [12, 12] : undefined,
          stroke: realStrokeColor,
          strokeWidth: lineWidth,
        }
      );
    }

    const last = controllers[controllers.length - 1];
    const secondToLast = controllers[controllers.length - 2];

    // TODO: Adjust arrow direction
    const { sides, end } = getArrowPoints(
      [secondToLast.x, secondToLast.y],
      [last.x, last.y],
      35
    );
    rc.linearPath(
      [
        [sides[0][0], sides[0][1]],
        [end[0], end[1]],
        [sides[1][0], sides[1][1]],
      ],
      {
        seed,
        roughness,
        strokeLineDash:
          strokeStyle === StrokeStyle.Dashed ? [12, 12] : undefined,
        stroke: realStrokeColor,
        strokeWidth: lineWidth,
      }
    );
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
