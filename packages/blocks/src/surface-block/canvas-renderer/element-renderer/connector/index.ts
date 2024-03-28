import type {
  ConnectorElementModel,
  PointStyle,
  StatelessConnectorElementModel,
} from '../../../element-model/connector.js';
import { ConnectorMode } from '../../../element-model/connector.js';
import type { PointLocation } from '../../../index.js';
import { getBezierParameters } from '../../../utils/curve.js';
import type { Renderer } from '../../renderer.js';
import {
  getArrowOptions,
  renderArrow,
  renderCircle,
  renderDiamond,
  renderTriangle,
} from './utils.js';

export function connector(
  model: ConnectorElementModel | StatelessConnectorElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) {
  const {
    absolutePath: points,
    mode,
    frontEndpointStyle: frontEndpointStyle,
    rearEndpointStyle: rearEndpointStyle,
  } = model;

  // points might not be build yet in some senarios
  // eg. undo/redo, copy/paste
  if (!points.length || points.length < 2) {
    return;
  }

  const [x, y] = model.deserializedXYWH;

  ctx.setTransform(matrix.translateSelf(-x, -y));

  renderPoints(
    model,
    ctx,
    renderer,
    points,
    model.strokeStyle === 'dash',
    mode === ConnectorMode.Curve
  );
  renderEndpoint(model, points, ctx, renderer, 'Front', frontEndpointStyle);
  renderEndpoint(model, points, ctx, renderer, 'Rear', rearEndpointStyle);
}

function renderPoints(
  model: ConnectorElementModel | StatelessConnectorElementModel,
  ctx: CanvasRenderingContext2D,
  renderer: Renderer,
  points: PointLocation[],
  dash: boolean,
  curve: boolean
) {
  const { seed, stroke, strokeWidth, roughness, rough } = model;
  const rc = renderer.rc;
  const realStrokeColor = renderer.getVariableColor(stroke);

  if (rough) {
    const options = {
      seed,
      roughness,
      strokeLineDash: dash ? [12, 12] : undefined,
      stroke: realStrokeColor,
      strokeWidth,
    };
    if (curve) {
      const b = getBezierParameters(model.absolutePath);
      rc.path(
        `M${b[0][0]},${b[0][1]} C${b[1][0]},${b[1][1]} ${b[2][0]},${b[2][1]}  ${b[3][0]},${b[3][1]} `,
        options
      );
    } else {
      rc.linearPath(points as unknown as [number, number][], options);
    }
  } else {
    ctx.save();
    ctx.strokeStyle = realStrokeColor;
    ctx.lineWidth = model.strokeWidth;
    ctx.lineJoin = 'round';
    dash && ctx.setLineDash([12, 12]);
    ctx.beginPath();
    if (curve) {
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point[0], point[1]);
        } else {
          const last = points[index - 1];
          ctx.bezierCurveTo(
            last.absOut[0],
            last.absOut[1],
            point.absIn[0],
            point.absIn[1],
            point[0],
            point[1]
          );
        }
      });
    } else {
      points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point[0], point[1]);
        } else {
          ctx.lineTo(point[0], point[1]);
        }
      });
    }
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }
}

function renderEndpoint(
  model: ConnectorElementModel | StatelessConnectorElementModel,
  location: PointLocation[],
  ctx: CanvasRenderingContext2D,
  renderer: Renderer,
  end: 'Front' | 'Rear',
  style: PointStyle
) {
  const arrowOptions = getArrowOptions(end, model, renderer);
  const rc = renderer.rc;

  switch (style) {
    case 'Arrow':
      renderArrow(location, ctx, rc, arrowOptions);
      break;
    case 'Triangle':
      renderTriangle(location, ctx, rc, arrowOptions);
      break;
    case 'Circle':
      renderCircle(location, ctx, rc, arrowOptions);
      break;
    case 'Diamond':
      renderDiamond(location, ctx, rc, arrowOptions);
      break;
  }
}
