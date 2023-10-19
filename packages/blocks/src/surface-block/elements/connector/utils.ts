import type { PointLocation } from '../../utils/point-location.js';
import { Vec } from '../../utils/vec.js';
import { ConnectorEnd } from './types.js';

export function getArrowPoints(
  point: PointLocation,
  size = 10,
  end: ConnectorEnd = ConnectorEnd.End
) {
  const unit = Vec.mul(point.tangent, -1);
  const angle = end === ConnectorEnd.Start ? Math.PI : 0;

  return {
    sides: [
      Vec.add(Vec.mul(Vec.rot(unit, angle + Math.PI / 10), size), point),
      Vec.add(Vec.mul(Vec.rot(unit, angle - Math.PI / 10), size), point),
    ],
  };
}
