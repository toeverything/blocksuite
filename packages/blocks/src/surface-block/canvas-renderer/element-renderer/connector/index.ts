import { assertExists } from '@blocksuite/global/utils';

import {
  ConnectorElementModel,
  type LocalConnectorElementModel,
  type PointStyle,
} from '../../../element-model/connector.js';
import { ConnectorMode } from '../../../element-model/connector.js';
import { type PointLocation, Vec } from '../../../index.js';
import {
  // getBezierCurvature,
  // getBezierNormal,
  getBezierParameters,
  // getBezierPoint,
  // getBezierTangent,
} from '../../../utils/curve.js';
import type { Renderer } from '../../renderer.js';
import {
  deltaInsertsToChunks,
  getFontString,
  getLineHeight,
  getTextWidth,
  isRTL,
  wrapTextDeltas,
} from '../text/utils.js';
import {
  getArrowOptions,
  renderArrow,
  renderCircle,
  renderDiamond,
  renderTriangle,
} from './utils.js';

export function connector(
  model: ConnectorElementModel | LocalConnectorElementModel,
  ctx: CanvasRenderingContext2D,
  matrix: DOMMatrix,
  renderer: Renderer
) {
  const {
    path: points,
    mode,
    strokeStyle,
    frontEndpointStyle,
    rearEndpointStyle,
  } = model;

  // points might not be build yet in some senarios
  // eg. undo/redo, copy/paste
  if (!points.length || points.length < 2) {
    return;
  }

  ctx.setTransform(matrix);

  renderPoints(
    model,
    ctx,
    renderer,
    points,
    strokeStyle === 'dash',
    mode === ConnectorMode.Curve
  );
  renderEndpoint(model, points, ctx, renderer, 'Front', frontEndpointStyle);
  renderEndpoint(model, points, ctx, renderer, 'Rear', rearEndpointStyle);

  if (
    model instanceof ConnectorElementModel &&
    model.displayText &&
    model.text?.length
  ) {
    renderLabel(matrix, model, ctx, renderer, points);
  }
}

function renderPoints(
  model: ConnectorElementModel | LocalConnectorElementModel,
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
      const b = getBezierParameters(points);
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
    ctx.lineWidth = strokeWidth;
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
  model: ConnectorElementModel | LocalConnectorElementModel,
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

function renderLabel(
  matrix: DOMMatrix,
  model: ConnectorElementModel,
  ctx: CanvasRenderingContext2D,
  renderer: Renderer,
  path: PointLocation[]
) {
  const {
    mode,
    color,
    fontSize,
    fontWeight,
    fontStyle,
    fontFamily,
    textAlign,
    // rotate,
  } = model;
  assertExists(model.text);

  const [, , w, _] = model.deserializedXYWH;
  const points: [number, number][] = path.map(p => [p[0], p[1]]);

  // const deltas: ITextDelta[] = yText.toDelta() as ITextDelta[];
  const font = getFontString({
    fontStyle,
    fontWeight,
    fontSize,
    fontFamily,
  });
  const deltas = wrapTextDeltas(model.text, font, w);
  const lines = deltaInsertsToChunks(deltas);
  const lineHeightPx = getLineHeight(fontFamily, fontSize);
  const horizontalOffset =
    textAlign === 'center' ? w / 2 : textAlign === 'right' ? w : 0;

  if (mode === ConnectorMode.Straight) {
    const first = points[0];
    const last = points[path.length - 1];
    const point = Vec.med(first, last);
    const y = point[1] - lines.length * lineHeightPx;
    ctx.setTransform(matrix.translate(0, y));
  } else if (mode === ConnectorMode.Orthogonal) {
    console.log(233);
  } else {
    // const b = getBezierParameters(path);
    // const p = getBezierCurvature(b, 0.5);
    // if (!p) return;
  }

  ctx.font = font;
  ctx.fillStyle = renderer.getVariableColor(color);
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'ideographic';

  for (const [lineIndex, line] of lines.entries()) {
    let beforeTextWidth = 0;

    for (const delta of line) {
      const str = delta.insert;
      const rtl = isRTL(str);
      const shouldTemporarilyAttach = rtl && !ctx.canvas.isConnected;
      if (shouldTemporarilyAttach) {
        // to correctly render RTL text mixed with LTR, we have to append it
        // to the DOM
        document.body.append(ctx.canvas);
      }

      ctx.canvas.setAttribute('dir', rtl ? 'rtl' : 'ltr');

      // 0.5 comes from v-line padding
      const offset =
        textAlign === 'center' ? 0 : textAlign === 'right' ? -0.5 : 0.5;
      ctx.fillText(
        str,
        horizontalOffset + beforeTextWidth + offset,
        (lineIndex + 1) * lineHeightPx
      );

      beforeTextWidth += getTextWidth(str, font);

      if (shouldTemporarilyAttach) {
        ctx.canvas.remove();
      }
    }
  }
}
