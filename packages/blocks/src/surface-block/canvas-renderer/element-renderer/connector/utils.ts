import type {
  ConnectorElementModel,
  StatelessConnectorElementModel,
} from '../../../element-model/connector.js';
import { ConnectorMode } from '../../../element-model/connector.js';
import type { PointLocation } from '../../../index.js';
import type { RoughCanvas } from '../../../rough/canvas.js';
import {
  type BezierCurveParameters,
  getBezierParameters,
  getBezierTangent,
} from '../../../utils/curve.js';
import { type IVec, Vec } from '../../../utils/vec.js';
import type { Renderer } from '../../renderer.js';

type ConnectorEnd = 'Front' | 'Rear';

export const DEFAULT_ARROW_SIZE = 15;

export function getArrowPoints(
  points: PointLocation[],
  size = 10,
  mode: ConnectorMode,
  bezierParameters: BezierCurveParameters,
  endPoint: ConnectorEnd = 'Rear',
  radians: number = Math.PI / 4
) {
  const anchorPoint = getPointWithTangent(
    points,
    mode,
    endPoint,
    bezierParameters
  );
  const unit = Vec.mul(anchorPoint.tangent, -1);
  const angle = endPoint === 'Front' ? Math.PI : 0;

  return {
    points: [
      Vec.add(Vec.mul(Vec.rot(unit, angle + radians), size), anchorPoint),
      anchorPoint,
      Vec.add(Vec.mul(Vec.rot(unit, angle - radians), size), anchorPoint),
    ],
  };
}

export function getCircleCenterPoint(
  points: PointLocation[],
  radius = 5,
  mode: ConnectorMode,
  bezierParameters: BezierCurveParameters,
  endPoint: ConnectorEnd = 'Rear'
) {
  const anchorPoint = getPointWithTangent(
    points,
    mode,
    endPoint,
    bezierParameters
  );

  const unit = Vec.mul(anchorPoint.tangent, -1);
  const angle = endPoint === 'Front' ? Math.PI : 0;

  return Vec.add(Vec.mul(Vec.rot(unit, angle), radius), anchorPoint);
}

export function getPointWithTangent(
  points: PointLocation[],
  mode: ConnectorMode,
  endPoint: ConnectorEnd,
  bezierParameters: BezierCurveParameters
) {
  const anchorIndex = endPoint === 'Rear' ? points.length - 1 : 0;
  const pointToAnchorIndex =
    endPoint === 'Rear' ? anchorIndex - 1 : anchorIndex + 1;
  const anchorPoint = points[anchorIndex];
  const pointToAnchor = points[pointToAnchorIndex];

  const clone = anchorPoint.clone();
  let tangent;
  if (mode !== ConnectorMode.Curve) {
    tangent =
      endPoint === 'Rear'
        ? Vec.tangent(anchorPoint, pointToAnchor)
        : Vec.tangent(pointToAnchor, anchorPoint);
  } else {
    tangent =
      endPoint === 'Rear'
        ? getBezierTangent(bezierParameters, 1)
        : getBezierTangent(bezierParameters, 0);
  }
  clone.tangent = tangent ?? [];

  return clone;
}

export function getDiamondPoints(
  point: PointLocation,
  size = 10,
  endPoint: ConnectorEnd = 'Rear'
) {
  const unit = Vec.mul(point.tangent, -1);
  const angle = endPoint === 'Front' ? Math.PI : 0;

  const diamondPoints = [
    Vec.add(Vec.mul(Vec.rot(unit, angle + Math.PI * 0.25), size), point),
    point,
    Vec.add(Vec.mul(Vec.rot(unit, angle - Math.PI * 0.25), size), point),
    Vec.add(Vec.mul(Vec.rot(unit, angle), size * Math.sqrt(2)), point),
  ];

  return {
    points: diamondPoints,
  };
}

export type ArrowOptions = ReturnType<typeof getArrowOptions>;

export function getArrowOptions(
  end: ConnectorEnd,
  model: ConnectorElementModel | StatelessConnectorElementModel,
  renderer: Renderer
) {
  const { stroke } = model;
  const realStrokeColor = renderer.getVariableColor(stroke);

  return {
    end,
    seed: model.seed,
    mode: model.mode,
    rough: model.rough,
    roughness: model.roughness,
    strokeColor: realStrokeColor,
    strokeWidth: model.strokeWidth,
    fillColor: realStrokeColor,
    fillStyle: 'solid',
    bezierParameters: getBezierParameters(model.absolutePath),
  };
}

export function getRcOptions(options: ArrowOptions) {
  const { seed, roughness, strokeWidth, strokeColor, fillColor } = options;
  return {
    seed,
    roughness,
    stroke: strokeColor,
    strokeWidth,
    fill: fillColor,
    fillStyle: 'solid',
  };
}

export function renderRoundedPolygon(
  ctx: CanvasRenderingContext2D,
  points: IVec[],
  color: string,
  strokeWidth: number,
  fill: boolean = true
) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.save();
  ctx.beginPath();

  for (let i = 0; i < points.length; i++) {
    if (i === 0) {
      ctx.moveTo(points[i][0], points[i][1]);
    } else {
      ctx.lineTo(points[i][0], points[i][1]);
    }
  }

  if (fill) {
    ctx.closePath();
    ctx.fill();
  }

  ctx.stroke();
  ctx.restore();
}

export function renderArrow(
  points: PointLocation[],
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  options: ArrowOptions
) {
  const { mode, end, bezierParameters, rough, strokeColor, strokeWidth } =
    options;
  const radians = Math.PI / 4;
  const size = DEFAULT_ARROW_SIZE * (strokeWidth / 2);
  const { points: arrowPoints } = getArrowPoints(
    points,
    size,
    mode,
    bezierParameters,
    end,
    radians
  );

  if (rough) {
    rc.linearPath(arrowPoints as [number, number][], getRcOptions(options));
  } else {
    renderRoundedPolygon(ctx, arrowPoints, strokeColor, strokeWidth, false);
  }
}

export function renderTriangle(
  points: PointLocation[],
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  options: ArrowOptions
) {
  const { mode, end, bezierParameters, rough, strokeColor, strokeWidth } =
    options;
  const radians = Math.PI / 6;
  const size = DEFAULT_ARROW_SIZE * (strokeWidth / 2);
  const { points: trianglePoints } = getArrowPoints(
    points,
    size,
    mode,
    bezierParameters,
    end,
    radians
  );

  if (rough) {
    rc.polygon(
      [
        [trianglePoints[0][0], trianglePoints[0][1]],
        [trianglePoints[1][0], trianglePoints[1][1]],
        [trianglePoints[2][0], trianglePoints[2][1]],
      ],
      getRcOptions(options)
    );
  } else {
    renderRoundedPolygon(ctx, trianglePoints, strokeColor, strokeWidth);
  }
}

export function renderDiamond(
  points: PointLocation[],
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  options: ArrowOptions
) {
  const { mode, end, rough, bezierParameters, strokeColor, strokeWidth } =
    options;
  const anchorPoint = getPointWithTangent(points, mode, end, bezierParameters);
  const size = 10 * (strokeWidth / 2);
  const { points: diamondPoints } = getDiamondPoints(anchorPoint, size, end);

  if (rough) {
    rc.polygon(
      [
        [diamondPoints[0][0], diamondPoints[0][1]],
        [diamondPoints[1][0], diamondPoints[1][1]],
        [diamondPoints[2][0], diamondPoints[2][1]],
        [diamondPoints[3][0], diamondPoints[3][1]],
      ],
      getRcOptions(options)
    );
  } else {
    renderRoundedPolygon(ctx, diamondPoints, strokeColor, strokeWidth);
  }
}

export function renderCircle(
  points: PointLocation[],
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  options: ArrowOptions
) {
  const {
    bezierParameters,
    mode,
    end,
    fillColor,
    strokeColor,
    strokeWidth,
    rough,
  } = options;
  const radius = 5 * (strokeWidth / 2);
  const centerPoint = getCircleCenterPoint(
    points,
    radius,
    mode,
    bezierParameters,
    end
  );
  const cx = centerPoint[0];
  const cy = centerPoint[1];

  if (rough) {
    // radius + 2 when render rough circle to avoid connector line cross the circle and make it looks bad
    rc.circle(cx, cy, radius + 2, getRcOptions(options));
  } else {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, radius, radius, 0, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
