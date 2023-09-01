import type { PointLocation } from '../../utils/point-location.js';
import { Vec } from '../../utils/vec.js';

export function getArrowPoints(point: PointLocation, size = 10) {
  const unit = Vec.mul(point.tangent, -1);
  return {
    sides: [
      Vec.add(Vec.mul(Vec.rot(unit, Math.PI / 10), size), point),
      Vec.add(Vec.mul(Vec.rot(unit, -Math.PI / 10), size), point),
    ],
  };
}
