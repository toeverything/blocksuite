import type { RoughCanvas } from '../../index.js';
import {
  type BezierCurveParameters,
  getBezierTangent,
} from '../../utils/curve.js';
import type { PointLocation } from '../../utils/point-location.js';
import { type IVec, Vec } from '../../utils/vec.js';
import { ConnectorEndpoint, ConnectorMode } from './types.js';

export function getArrowPoints(
  points: PointLocation[],
  size = 10,
  mode: ConnectorMode,
  bezierParameters: BezierCurveParameters,
  endPoint: ConnectorEndpoint = ConnectorEndpoint.Rear,
  radians: number = Math.PI / 4
) {
  const anchorPoint = getPointWithTangent(
    points,
    mode,
    endPoint,
    bezierParameters
  );
  const unit = Vec.mul(anchorPoint.tangent, -1);
  const angle = endPoint === ConnectorEndpoint.Front ? Math.PI : 0;

  return {
    points: [
      Vec.add(Vec.mul(Vec.rot(unit, angle + radians), size), anchorPoint),
      anchorPoint,
      Vec.add(Vec.mul(Vec.rot(unit, angle - radians), size), anchorPoint),
    ],
  };
}

export function getPointWithTangent(
  points: PointLocation[],
  mode: ConnectorMode,
  endPoint: ConnectorEndpoint,
  bezierParameters: BezierCurveParameters
) {
  const anchorIndex =
    endPoint === ConnectorEndpoint.Rear ? points.length - 1 : 0;
  const pointToAnchorIndex =
    endPoint === ConnectorEndpoint.Rear ? anchorIndex - 1 : anchorIndex + 1;
  const anchorPoint = points[anchorIndex];
  const pointToAnchor = points[pointToAnchorIndex];

  const clone = anchorPoint.clone();
  clone.tangent =
    mode !== ConnectorMode.Curve
      ? endPoint === ConnectorEndpoint.Rear
        ? Vec.tangent(anchorPoint, pointToAnchor)
        : Vec.tangent(pointToAnchor, anchorPoint)
      : getBezierTangent(bezierParameters, 1) ?? [];

  return clone;
}

export function getDiamondPoints(
  point: PointLocation,
  size = 10,
  endPoint: ConnectorEndpoint = ConnectorEndpoint.Rear
) {
  const unit = Vec.mul(point.tangent, -1);
  const angle = endPoint === ConnectorEndpoint.Front ? Math.PI : 0;

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

export type ArrowOptions = {
  end: ConnectorEndpoint;
  seed: number;
  mode: ConnectorMode;
  rough: boolean;
  roughness: number;
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  fillStyle: string;
  bezierParameters: BezierCurveParameters;
};

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

export function renderArrowShape(
  ctx: CanvasRenderingContext2D,
  points: IVec[],
  color: string,
  strokeWidth: number
) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.save();
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point[0], point[1]);
    } else {
      ctx.lineTo(point[0], point[1]);
    }
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function renderTriangle(
  points: PointLocation[],
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  options: ArrowOptions
) {
  const { mode, end, bezierParameters, rough, strokeColor, strokeWidth } =
    options;
  const radians = Math.PI / 10;
  const { points: trianglePoints } = getArrowPoints(
    points,
    15,
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
    renderArrowShape(ctx, trianglePoints, strokeColor, strokeWidth);
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
  const { points: diamondPoints } = getDiamondPoints(anchorPoint, 10, end);

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
    renderArrowShape(ctx, diamondPoints, strokeColor, strokeWidth);
  }
}

export function renderCircle(
  points: PointLocation[],
  ctx: CanvasRenderingContext2D,
  rc: RoughCanvas,
  options: ArrowOptions
) {
  const radius = 5;
  const {
    bezierParameters,
    mode,
    end,
    fillColor,
    strokeColor,
    strokeWidth,
    rough,
  } = options;
  const anchorPoint = getPointWithTangent(points, mode, end, bezierParameters);
  let cx = anchorPoint[0];
  let cy = anchorPoint[1];
  if (end === ConnectorEndpoint.Rear) {
    // need to calculate the center point according to the tangent
    cx -= anchorPoint.tangent[0] * radius;
    cy -= anchorPoint.tangent[1] * radius;
  } else {
    cx += anchorPoint.tangent[0] * radius;
    cy += anchorPoint.tangent[1] * radius;
  }

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
