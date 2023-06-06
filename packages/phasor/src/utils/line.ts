import { clamp, type Point } from '@blocksuite/blocks';
import { almostEqual } from '@blocksuite/blocks';
const EPSILON = 1e-12;
const MACHINE_EPSILON = 1.12e-16;
export class Line {
  static intersect(
    sp: Point,
    ep: Point,
    sp2: Point,
    ep2: Point,
    infinite = false
  ): Point | null {
    const v1 = ep.subtract(sp);
    const v2 = ep2.subtract(sp2);
    const cross = v1.cross(v2);
    // Avoid divisions by 0, and errors when getting too close to 0
    if (almostEqual(cross, 0, MACHINE_EPSILON)) return null;
    const d = sp.subtract(sp2);
    let u1 = v2.cross(d) / cross;
    const u2 = v1.cross(d) / cross,
      // Check the ranges of the u parameters if the line is not
      // allowed to extend beyond the definition points, but
      // compare with EPSILON tolerance over the [0, 1] bounds.
      epsilon = /*#=*/ EPSILON,
      uMin = -epsilon,
      uMax = 1 + epsilon;

    if (infinite || (uMin < u1 && u1 < uMax && uMin < u2 && u2 < uMax)) {
      // Address the tolerance at the bounds by clipping to
      // the actual range.
      if (!infinite) {
        u1 = clamp(u1, 0, 1);
      }
      return sp.lerp(v1, u1);
    }
    return null;
  }
}
