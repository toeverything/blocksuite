import {
  type BezierCurveParameters,
  getBezierTangent,
} from '../../utils/curve.js';
import type { PointLocation } from '../../utils/point-location.js';
import { Vec } from '../../utils/vec.js';
import { ConnectorEnd, ConnectorMode } from './types.js';

export function getArrowPoints(
  point: PointLocation,
  size = 10,
  end: ConnectorEnd = ConnectorEnd.End,
  angleRatio = 0.25
) {
  const unit = Vec.mul(point.tangent, -1);
  const angle = end === ConnectorEnd.Start ? Math.PI : 0;

  return {
    points: [
      Vec.add(
        Vec.mul(Vec.rot(unit, angle + Math.PI * angleRatio), size),
        point
      ),
      point,
      Vec.add(
        Vec.mul(Vec.rot(unit, angle - Math.PI * angleRatio), size),
        point
      ),
    ],
  };
}

export function getPointWithTangent(
  points: PointLocation[],
  mode: ConnectorMode,
  end: ConnectorEnd,
  bezierParameters: BezierCurveParameters
) {
  const anchorIndex = end === ConnectorEnd.End ? points.length - 1 : 0;
  const pointToAnchorIndex =
    end === ConnectorEnd.End ? anchorIndex - 1 : anchorIndex + 1;
  const anchorPoint = points[anchorIndex];
  const pointToAnchor = points[pointToAnchorIndex];

  const clone = anchorPoint.clone();
  clone.tangent =
    mode !== ConnectorMode.Curve
      ? end === ConnectorEnd.End
        ? Vec.tangent(anchorPoint, pointToAnchor)
        : Vec.tangent(pointToAnchor, anchorPoint)
      : getBezierTangent(bezierParameters, 1) ?? [];

  return clone;
}
