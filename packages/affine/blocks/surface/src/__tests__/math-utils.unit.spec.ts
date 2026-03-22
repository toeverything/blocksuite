import {
  almostEqual,
  isPointOnLineSegment,
  type IVec,
  lineEllipseIntersects,
  lineIntersects,
  linePolygonIntersects,
  linePolylineIntersects,
  pointAlmostEqual,
  pointInPolygon,
  pointOnPolygonStoke,
  polygonGetPointTangent,
  rotatePoints,
  toDegree,
  toRadian,
} from '@blocksuite/global/gfx';
import { describe, expect, it } from 'vitest';

describe('Line', () => {
  it('should intersect', () => {
    let rst = lineIntersects([0, 0], [1, 1], [0, 1], [1, 0]);
    expect(rst).toBeDefined();
    expect(rst).toMatchObject([0.5, 0.5]);

    rst = lineIntersects([5, 5], [15, 5], [10, 0], [10, 10]);
    expect(rst).toBeDefined();
    expect(rst).toMatchObject([10, 5]);
  });

  it('should not intersect', () => {
    const rst = lineIntersects([0, 0], [1, 0], [0, 1], [1, 1]);
    expect(rst).toBeNull();
  });

  it('should intersect when infinity', () => {
    const rst = lineIntersects([0, 0], [0, 10], [1, 1], [10, 1], true);
    expect(rst).toBeDefined();
    expect(rst).toMatchObject([0, 1]);
  });

  it('lineEllipseIntersects', () => {
    const rst = lineEllipseIntersects([0, -5], [0, 5], [0, 0], 1, 1);
    const expected: IVec[] = [
      [0, 1],
      [0, -1],
    ];
    if (!rst) throw new Error('Failed to get line ellipse intersects');
    expect(
      rst.every((point, index) => pointAlmostEqual(point, expected[index]))
    ).toBeTruthy();
  });

  it('lineEllipseIntersects with rotate', () => {
    const rst = lineEllipseIntersects(
      [0, -5],
      [0, 5],
      [0, 0],
      3,
      2,
      Math.PI / 2
    );
    expect(rst).toBeDefined();
    if (rst) {
      pointAlmostEqual(rst[0], [0, 3]);
      pointAlmostEqual(rst[1], [0, -3]);
    }
  });

  it('linePolygonIntersects', () => {
    const rst = linePolygonIntersects(
      [5, 5],
      [15, 5],
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ]
    );
    if (!rst) throw new Error('Failed to get line polygon intersects');
    expect(pointAlmostEqual(rst[0], [10, 5])).toBeTruthy();
  });

  it('linePolylineIntersects', () => {
    const rst = linePolylineIntersects(
      [5, 5],
      [-5, 5],
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ]
    );

    expect(rst).toBeNull();
  });

  it('isPointOnLineSegment', () => {
    const line: IVec[] = [
      [0, 0],
      [1, 0],
    ];
    const point: IVec = [0.5, 0];
    expect(isPointOnLineSegment(point, line)).toBe(true);
    expect(isPointOnLineSegment([0.01, 0], line)).toBe(true);
    expect(isPointOnLineSegment([-0.01, 0], line)).toBe(false);
    expect(isPointOnLineSegment([0.5, 0.1], line)).toBe(false);
    expect(isPointOnLineSegment([0.5, -0.1], line)).toBe(false);
  });

  it('rotatePoints', () => {
    const points: IVec[] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    const rst = rotatePoints(points, [0.5, 0.5], 90);
    const expected = [
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ];
    expect(
      rst.every((p, i) => {
        return (
          almostEqual(p[0], expected[i][0]) && almostEqual(p[1], expected[i][1])
        );
      })
    ).toBeTruthy();
  });

  it('polygonGetPointTangent', () => {
    const points: IVec[] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];
    expect(polygonGetPointTangent(points, [0, 0.5])).toMatchObject([0, -1]);
    expect(polygonGetPointTangent(points, [0.5, 0])).toMatchObject([1, 0]);
  });

  it('toRadian', () => {
    expect(toRadian(180)).toBe(Math.PI);
    expect(toRadian(90)).toBe(Math.PI / 2);
    expect(toRadian(0)).toBe(0);
    expect(toRadian(360)).toBe(Math.PI * 2);
  });

  it('toDegree', () => {
    expect(toDegree(Math.PI)).toBe(180);
    expect(toDegree(Math.PI / 2)).toBe(90);
    expect(toDegree(0)).toBe(0);
    expect(toDegree(Math.PI * 2)).toBe(360);
  });
});

/**
 * Tests for pointInPolygon (winding-number algorithm).
 *
 * The winding-number algorithm correctly classifies points inside and outside
 * both convex and concave (non-convex) polygons.  This is essential for
 * accurate drag-to-move hit-testing on edgeless polygon shapes: a click
 * anywhere inside the visible polygon body must register as a hit even when
 * the polygon is concave (e.g. an L-shape or star).
 */
describe('pointInPolygon – winding-number hit-testing', () => {
  // ── Convex polygon tests ──────────────────────────────────────────────────

  describe('convex square [0,0]→[10,10]', () => {
    const square: IVec[] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];

    it('detects a point at the centre as inside', () => {
      expect(pointInPolygon([5, 5], square)).toBe(true);
    });

    it('detects a point near a corner (but inside) as inside', () => {
      expect(pointInPolygon([1, 1], square)).toBe(true);
      expect(pointInPolygon([9, 9], square)).toBe(true);
    });

    it('detects a point well outside as outside', () => {
      expect(pointInPolygon([15, 5], square)).toBe(false);
      expect(pointInPolygon([-1, 5], square)).toBe(false);
      expect(pointInPolygon([5, -1], square)).toBe(false);
      expect(pointInPolygon([5, 11], square)).toBe(false);
    });

    it('detects a point diagonally outside as outside', () => {
      expect(pointInPolygon([11, 11], square)).toBe(false);
      expect(pointInPolygon([-1, -1], square)).toBe(false);
    });
  });

  describe('convex triangle', () => {
    // Right-angled triangle with vertices at (0,0), (10,0), (0,10)
    const triangle: IVec[] = [
      [0, 0],
      [10, 0],
      [0, 10],
    ];

    it('detects centroid as inside', () => {
      // Centroid ≈ (3.33, 3.33)
      expect(pointInPolygon([3, 3], triangle)).toBe(true);
    });

    it('detects hypotenuse interior side as inside', () => {
      expect(pointInPolygon([2, 2], triangle)).toBe(true);
    });

    it('detects point beyond hypotenuse as outside', () => {
      // Point (7,7) is beyond the hypotenuse x+y=10
      expect(pointInPolygon([7, 7], triangle)).toBe(false);
    });
  });

  describe('convex pentagon (default polygon shape)', () => {
    // Normalised pentagon vertices used as default polygon in the editor,
    // scaled to a 100×100 bounding box so absolute coords are easy to reason about.
    const scaleVerts = (verts: number[][], w: number, h: number): IVec[] =>
      verts.map(v => [v[0] * w, v[1] * h]);

    const normalised = [
      [0.5, 0],
      [1, 0.38],
      [0.81, 1],
      [0.19, 1],
      [0, 0.38],
    ];
    const pentagon = scaleVerts(normalised, 100, 100);

    it('detects the geometric centre as inside', () => {
      expect(pointInPolygon([50, 50], pentagon)).toBe(true);
    });

    it('detects a point clearly outside the bounding box as outside', () => {
      expect(pointInPolygon([150, 50], pentagon)).toBe(false);
      expect(pointInPolygon([50, 150], pentagon)).toBe(false);
    });

    it('detects a point near a top corner of the bbox but outside the polygon as outside', () => {
      // Top-left corner [0,0] is outside the pentagon (first vertex is at [50,0])
      expect(pointInPolygon([2, 2], pentagon)).toBe(false);
      // Top-right corner [100,0] is outside
      expect(pointInPolygon([98, 2], pentagon)).toBe(false);
    });
  });

  // ── Concave polygon tests ─────────────────────────────────────────────────

  describe('concave L-shape polygon', () => {
    /**
     * L-shaped polygon (concave), defined clockwise:
     *
     *   (0,0)──(6,0)
     *     |      |
     *   (0,4)  (6,4)──(10,4)
     *     |              |
     *   (0,10)────────(10,10)
     *
     * The "notch" region (x∈[6,10], y∈[0,4]) is OUTSIDE the polygon.
     */
    const lShape: IVec[] = [
      [0, 0],
      [6, 0],
      [6, 4],
      [10, 4],
      [10, 10],
      [0, 10],
    ];

    it('detects a point in the vertical bar of the L as inside', () => {
      expect(pointInPolygon([3, 5], lShape)).toBe(true);
    });

    it('detects a point in the horizontal bar of the L as inside', () => {
      expect(pointInPolygon([8, 7], lShape)).toBe(true);
    });

    it('detects the concave notch region as outside', () => {
      // The notch: x∈(6,10), y∈(0,4) — this is the "missing" piece of the L
      expect(pointInPolygon([8, 2], lShape)).toBe(false);
    });

    it('detects a point far outside as outside', () => {
      expect(pointInPolygon([11, 5], lShape)).toBe(false);
      expect(pointInPolygon([5, 11], lShape)).toBe(false);
    });

    it('detects the inner concave corner region correctly', () => {
      // Just inside the inner concave corner
      expect(pointInPolygon([5, 5], lShape)).toBe(true);
      // Just inside the lower-right region
      expect(pointInPolygon([9, 9], lShape)).toBe(true);
    });
  });

  describe('concave star-like polygon (5-pointed)', () => {
    /**
     * A simple star approximation using 10 vertices alternating between an
     * outer radius (r=5) and inner radius (r=2) centred at (5,5).
     * This is a complex concave shape with multiple concavities — a stress
     * test for the winding-number algorithm.
     */
    const starVertices: IVec[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
      const r = i % 2 === 0 ? 5 : 2; // outer or inner radius
      starVertices.push([5 + r * Math.cos(angle), 5 + r * Math.sin(angle)]);
    }

    it('detects the centre of the star as inside', () => {
      expect(pointInPolygon([5, 5], starVertices)).toBe(true);
    });

    it('detects the tip of a point (outer vertex) neighbourhood as inside', () => {
      // Slightly inside a spike tip — just past the outer vertex
      expect(pointInPolygon([5, 0.3], starVertices)).toBe(true);
    });

    it('detects the concave indentation between spikes as outside', () => {
      // Point between two spikes is outside the star
      // Between spike at top (angle=-90°) and spike at upper-right (angle=-54°)
      // the inner vertex is at angle ≈ -72° from center with r=2
      // A point at angle -72° with r=3 (between inner=2 and outer=5) is outside
      const angle = -Math.PI / 2 + (2 * Math.PI) / 10; // -72 degrees
      const r = 3.5; // between inner (2) and outer (5)
      const px = 5 + r * Math.cos(angle);
      const py = 5 + r * Math.sin(angle);
      expect(pointInPolygon([px, py], starVertices)).toBe(false);
    });

    it('detects a point far outside the bounding box as outside', () => {
      expect(pointInPolygon([15, 5], starVertices)).toBe(false);
    });
  });

  describe('bounding-box vs polygon accuracy', () => {
    /**
     * These tests specifically verify that the winding-number algorithm gives
     * different results from a naïve bounding-box containment check.
     * A bounding-box check would return true for the notch of a concave polygon;
     * the winding-number algorithm correctly returns false.
     */
    const lShape: IVec[] = [
      [0, 0],
      [6, 0],
      [6, 4],
      [10, 4],
      [10, 10],
      [0, 10],
    ];

    it('returns false for a point inside the bbox but outside the concave notch', () => {
      // Bounding box is [0,0]→[10,10].  Point (8,2) is inside the bbox but
      // outside the L-shape polygon (it is in the notch).
      const p: IVec = [8, 2];
      // Sanity: confirm it IS within the axis-aligned bounding box
      expect(p[0] >= 0 && p[0] <= 10 && p[1] >= 0 && p[1] <= 10).toBe(true);
      // But the winding-number algorithm correctly reports it as outside
      expect(pointInPolygon(p, lShape)).toBe(false);
    });
  });
});

/**
 * Tests for pointOnPolygonStoke (distance-to-edge hit-testing).
 *
 * Used as the first check in polygon.includesPoint to detect clicks on the
 * polygon's stroke/outline before falling back to interior testing.
 */
describe('pointOnPolygonStoke', () => {
  const square: IVec[] = [
    [0, 0],
    [10, 0],
    [10, 10],
    [0, 10],
  ];

  it('detects a point exactly on an edge as on-stroke', () => {
    // Point on top edge
    expect(pointOnPolygonStoke([5, 0], square, 1)).toBe(true);
    // Point on right edge
    expect(pointOnPolygonStoke([10, 5], square, 1)).toBe(true);
    // Point on bottom edge
    expect(pointOnPolygonStoke([5, 10], square, 1)).toBe(true);
    // Point on left edge
    expect(pointOnPolygonStoke([0, 5], square, 1)).toBe(true);
  });

  it('detects a point within threshold of an edge as on-stroke', () => {
    // 0.5 units inside the top edge, threshold=1
    expect(pointOnPolygonStoke([5, 0.5], square, 1)).toBe(true);
  });

  it('detects a point beyond threshold as not on-stroke', () => {
    // 2 units inside the top edge, threshold=1
    expect(pointOnPolygonStoke([5, 2], square, 1)).toBe(false);
    // Interior point well away from all edges
    expect(pointOnPolygonStoke([5, 5], square, 1)).toBe(false);
  });

  it('detects a point outside the polygon but close to an edge as on-stroke', () => {
    // 0.5 units outside the top edge, threshold=1
    expect(pointOnPolygonStoke([5, -0.5], square, 1)).toBe(true);
  });

  it('threshold=0 only matches points exactly on the edge (within floating-point)', () => {
    expect(pointOnPolygonStoke([5, 0], square, 0)).toBe(true);
    expect(pointOnPolygonStoke([5, 1], square, 0)).toBe(false);
  });
});
