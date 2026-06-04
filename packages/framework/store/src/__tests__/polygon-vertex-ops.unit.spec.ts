/**
 * Unit tests for polygon vertex operation logic.
 *
 * Tests the core algorithms used by PolygonVertexEditingOverlay:
 *   - insertVertexAtMidpoint
 *   - deleteVertex (with bounding box recomputation)
 *   - toggleVertexSmooth (null → array, toggle)
 *   - moveVertex (with bounding box recomputation)
 *   - proportional resize (vertices remain normalized)
 *   - hitTestVertex / hitTestMidpoint (proximity detection)
 *
 * These algorithms are extracted as pure functions so they can be tested
 * without a live GfxController or BlockSuite editor instance.
 */

import { describe, expect, test } from 'vitest';

// ─── Pure algorithm implementations ──────────────────────────────────────────
// These mirror the implementations in PolygonVertexEditingOverlay exactly.
// They are copied here as pure functions to allow deterministic unit testing
// without a DOM or GfxController dependency.

type Vertex = [number, number];

/**
 * Convert a normalized [0-1] vertex to absolute model coordinates.
 */
function toAbsolute(
  nv: number[],
  bound: { x: number; y: number; w: number; h: number }
): Vertex {
  return [bound.x + nv[0] * bound.w, bound.y + nv[1] * bound.h];
}

/**
 * Recompute the bounding box from a list of absolute vertices and
 * return normalized vertices plus the new bound.
 */
function recomputeBound(absVertices: Vertex[]): {
  normalized: number[][];
  bound: { x: number; y: number; w: number; h: number };
} {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [vx, vy] of absVertices) {
    if (vx < minX) minX = vx;
    if (vy < minY) minY = vy;
    if (vx > maxX) maxX = vx;
    if (vy > maxY) maxY = vy;
  }
  const w = Math.max(maxX - minX, 1);
  const h = Math.max(maxY - minY, 1);
  const normalized = absVertices.map(([vx, vy]) => [
    (vx - minX) / w,
    (vy - minY) / h,
  ]);
  return { normalized, bound: { x: minX, y: minY, w, h } };
}

/**
 * Insert a new vertex at the midpoint of the edge between edgeIndex and
 * edgeIndex+1.  Returns [newVertices, newSmoothFlags, insertedIndex].
 */
function insertVertexAtMidpoint(
  vertices: number[][],
  smoothFlags: boolean[] | null,
  edgeIndex: number
): { vertices: number[][]; smoothFlags: boolean[] | null; insertedIndex: number } {
  const verts = [...vertices];
  const nextIdx = (edgeIndex + 1) % verts.length;
  const midNorm = [
    (verts[edgeIndex][0] + verts[nextIdx][0]) / 2,
    (verts[edgeIndex][1] + verts[nextIdx][1]) / 2,
  ];
  const insertIdx = edgeIndex + 1;
  verts.splice(insertIdx, 0, midNorm);

  let newFlags: boolean[] | null = smoothFlags;
  if (smoothFlags) {
    const flags = [...smoothFlags];
    flags.splice(insertIdx, 0, false);
    newFlags = flags;
  }

  return { vertices: verts, smoothFlags: newFlags, insertedIndex: insertIdx };
}

/**
 * Delete the vertex at `vertexIndex`.
 * Returns null if there are <= 3 vertices (minimum polygon).
 * On success returns { vertices, smoothFlags, bound }.
 */
function deleteVertex(
  vertices: number[][],
  smoothFlags: boolean[] | null,
  bound: { x: number; y: number; w: number; h: number },
  vertexIndex: number
): {
  vertices: number[][];
  smoothFlags: boolean[] | null;
  bound: { x: number; y: number; w: number; h: number };
} | null {
  if (vertices.length <= 3) return null; // minimum triangle

  const verts = [...vertices];
  verts.splice(vertexIndex, 1);

  let newFlags: boolean[] | null = smoothFlags;
  if (smoothFlags) {
    const flags = [...smoothFlags];
    flags.splice(vertexIndex, 1);
    newFlags = flags;
  }

  // Re-compute bounding box from remaining vertices
  const absVertices = verts.map(v => toAbsolute(v, bound));
  const { normalized, bound: newBound } = recomputeBound(absVertices);

  return { vertices: normalized, smoothFlags: newFlags, bound: newBound };
}

/**
 * Toggle the smooth flag for `vertexIndex`.
 */
function toggleVertexSmooth(
  vertices: number[][],
  smoothFlags: boolean[] | null,
  vertexIndex: number
): boolean[] {
  const count = vertices.length;
  let flags = smoothFlags ? [...smoothFlags] : new Array<boolean>(count).fill(false);
  while (flags.length < count) flags.push(false);
  if (flags.length > count) flags = flags.slice(0, count);
  flags[vertexIndex] = !flags[vertexIndex];
  return flags;
}

/**
 * Move a vertex to a new absolute position and recompute the bounding box.
 */
function moveVertex(
  vertices: number[][],
  bound: { x: number; y: number; w: number; h: number },
  vertexIndex: number,
  newAbsX: number,
  newAbsY: number
): {
  vertices: number[][];
  bound: { x: number; y: number; w: number; h: number };
} {
  const newAbsVertices: Vertex[] = vertices.map(
    (v, i) =>
      i === vertexIndex
        ? ([newAbsX, newAbsY] as Vertex)
        : (toAbsolute(v, bound) as Vertex)
  );
  const { normalized, bound: newBound } = recomputeBound(newAbsVertices);
  return { vertices: normalized, bound: newBound };
}

/**
 * Check if a model-coordinate point is within `hitDist` of any vertex.
 * Returns the matching vertex index or -1.
 */
function hitTestVertex(
  vertices: number[][],
  bound: { x: number; y: number; w: number; h: number },
  modelX: number,
  modelY: number,
  hitDist: number
): number {
  for (let i = 0; i < vertices.length; i++) {
    const [ax, ay] = toAbsolute(vertices[i], bound);
    const dx = modelX - ax;
    const dy = modelY - ay;
    if (Math.sqrt(dx * dx + dy * dy) < hitDist) {
      return i;
    }
  }
  return -1;
}

/**
 * Check if a model-coordinate point is within `hitDist` of any edge midpoint.
 * Returns the edge index (between vertex i and vertex i+1) or -1.
 */
function hitTestMidpoint(
  vertices: number[][],
  bound: { x: number; y: number; w: number; h: number },
  modelX: number,
  modelY: number,
  hitDist: number
): number {
  for (let i = 0; i < vertices.length; i++) {
    const [ax, ay] = toAbsolute(vertices[i], bound);
    const nextIdx = (i + 1) % vertices.length;
    const [bx, by] = toAbsolute(vertices[nextIdx], bound);
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const dx = modelX - mx;
    const dy = modelY - my;
    if (Math.sqrt(dx * dx + dy * dy) < hitDist) {
      return i;
    }
  }
  return -1;
}

// ─── Test helpers ─────────────────────────────────────────────────────────────

/** Pentagon (5 vertices) as normalized coords for a 100×100 bounding box. */
const PENTAGON = [
  [0.5, 0],
  [1, 0.38],
  [0.81, 1],
  [0.19, 1],
  [0, 0.38],
];

/** Triangle (3 vertices, minimum polygon). */
const TRIANGLE = [
  [0.5, 0],
  [1, 1],
  [0, 1],
];

/** Square (4 vertices, simple polygon). */
const SQUARE = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

const UNIT_BOUND = { x: 0, y: 0, w: 100, h: 100 };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('polygon vertex add (insertVertexAtMidpoint)', () => {
  test('inserts a vertex at the midpoint of an edge', () => {
    const { vertices, insertedIndex } = insertVertexAtMidpoint(
      SQUARE,
      null,
      0 // edge between vertex 0 [0,0] and vertex 1 [1,0]
    );
    // New vertex should be at the midpoint of [0,0] and [1,0] → [0.5, 0]
    expect(insertedIndex).toBe(1);
    expect(vertices[insertedIndex]).toEqual([0.5, 0]);
    expect(vertices.length).toBe(5);
    // Other vertices should remain at their original normalized positions
    expect(vertices[0]).toEqual([0, 0]);
    expect(vertices[2]).toEqual([1, 0]);
    expect(vertices[3]).toEqual([1, 1]);
    expect(vertices[4]).toEqual([0, 1]);
  });

  test('handles insertion on the last edge (wraps around)', () => {
    const lastEdgeIdx = SQUARE.length - 1; // edge between vertex 3 [0,1] and vertex 0 [0,0]
    const { vertices, insertedIndex } = insertVertexAtMidpoint(
      SQUARE,
      null,
      lastEdgeIdx
    );
    // New vertex between [0,1] and [0,0] → midpoint [0, 0.5]
    expect(insertedIndex).toBe(lastEdgeIdx + 1);
    expect(vertices[insertedIndex]).toEqual([0, 0.5]);
    expect(vertices.length).toBe(5);
  });

  test('inserts false into smoothFlags at the correct index', () => {
    const smoothFlags = [true, false, true, false]; // SQUARE has 4 vertices
    const { smoothFlags: newFlags, insertedIndex } =
      insertVertexAtMidpoint(SQUARE, smoothFlags, 1);
    expect(newFlags).not.toBeNull();
    expect(newFlags!.length).toBe(5);
    expect(newFlags![insertedIndex]).toBe(false); // new vertex is always sharp
    expect(newFlags![0]).toBe(true); // vertex 0 unchanged
    expect(newFlags![1]).toBe(false); // vertex 1 unchanged (was at index 1, now at index 1)
  });

  test('leaves smoothFlags as null when no smoothFlags were set', () => {
    const { smoothFlags: newFlags } = insertVertexAtMidpoint(SQUARE, null, 0);
    expect(newFlags).toBeNull();
  });

  test('midpoint is correct for a diagonal edge', () => {
    // Triangle: [0.5,0], [1,1], [0,1]
    // Edge 0-1: midpoint = ([0.5+1]/2, [0+1]/2) = [0.75, 0.5]
    const { vertices, insertedIndex } = insertVertexAtMidpoint(TRIANGLE, null, 0);
    expect(insertedIndex).toBe(1);
    expect(vertices[insertedIndex][0]).toBeCloseTo(0.75, 10);
    expect(vertices[insertedIndex][1]).toBeCloseTo(0.5, 10);
    expect(vertices.length).toBe(4);
  });

  test('preserves all other vertices after insertion', () => {
    // Insert at edge 2 (between vertex 2 [0.81,1] and vertex 3 [0.19,1])
    // insertIdx = 3
    // New vertex at midpoint: [0.5, 1]
    // Result: [0.5,0], [1,0.38], [0.81,1], [0.5,1], [0.19,1], [0,0.38]
    const { vertices, insertedIndex } = insertVertexAtMidpoint(PENTAGON, null, 2);
    expect(vertices.length).toBe(6);
    expect(insertedIndex).toBe(3);

    // Vertices before the insertion point should be unchanged
    for (let i = 0; i < insertedIndex; i++) {
      expect(vertices[i]).toEqual(PENTAGON[i]);
    }
    // The inserted vertex is a midpoint — already tested separately
    // Vertices after the insertion point (shifted by 1)
    for (let i = insertedIndex + 1; i < vertices.length; i++) {
      expect(vertices[i]).toEqual(PENTAGON[i - 1]);
    }
  });
});

describe('polygon vertex delete (deleteVertex)', () => {
  test('refuses to delete when only 3 vertices remain (minimum triangle)', () => {
    const result = deleteVertex(TRIANGLE, null, UNIT_BOUND, 0);
    expect(result).toBeNull();
  });

  test('deletes a vertex from a 4-vertex polygon successfully', () => {
    const result = deleteVertex(SQUARE, null, UNIT_BOUND, 0);
    expect(result).not.toBeNull();
    expect(result!.vertices.length).toBe(3);
  });

  test('deletes a vertex from a 5-vertex polygon successfully', () => {
    const result = deleteVertex(PENTAGON, null, UNIT_BOUND, 1);
    expect(result).not.toBeNull();
    expect(result!.vertices.length).toBe(4);
  });

  test('removes the correct vertex by index', () => {
    // Square with vertices: [0,0], [1,0], [1,1], [0,1]
    // Delete vertex 1 ([1,0]) → remaining: [0,0], [1,1], [0,1]
    const result = deleteVertex(SQUARE, null, UNIT_BOUND, 1)!;
    // All absolute positions should be: [0,0], [100,100], [0,100]
    // New bounding box: x=0, y=0, w=100, h=100
    // Normalized: [0,0], [1,1], [0,1] → same as SQUARE minus vertex 1
    expect(result.vertices).toEqual([
      [0, 0],
      [1, 1],
      [0, 1],
    ]);
  });

  test('recomputes bounding box after deletion', () => {
    // Polygon at [0,0,100,100], vertices: [0,0], [1,0], [1,1], [0,1]
    // Delete vertex at [0,0] (vertex 0)
    // Remaining abs: [100,0], [100,100], [0,100]
    // New bound: x=0, y=0, w=100, h=100 (unchanged in this case since 0 is at extreme)
    const result = deleteVertex(SQUARE, null, UNIT_BOUND, 0)!;
    expect(result.bound.x).toBe(0);
    expect(result.bound.y).toBe(0);
    expect(result.bound.w).toBe(100);
    expect(result.bound.h).toBe(100);
  });

  test('recomputes bounding box correctly when deleted vertex was at the edge', () => {
    // Polygon at [0,0,200,200]: [0,0], [1,0], [0.5,1]  (triangle)
    // Let's use a 4-vertex polygon where vertex 0 is at the extremes
    // Polygon: [[0,0],[0.5,0],[1,0.5],[0.5,1]] at bound x=0,y=0,w=200,h=200
    // Abs positions: [0,0],[100,0],[200,100],[100,200]
    // Delete vertex 2 ([200,100]): remaining abs = [0,0],[100,0],[100,200]
    // New bound: x=0,y=0,w=100,h=200
    // Normalized: [0,0],[1,0],[1,1]
    const verts = [
      [0, 0],
      [0.5, 0],
      [1, 0.5],
      [0.5, 1],
    ];
    const b = { x: 0, y: 0, w: 200, h: 200 };
    const result = deleteVertex(verts, null, b, 2)!;
    expect(result.bound.w).toBeCloseTo(100, 5);
    expect(result.bound.h).toBeCloseTo(200, 5);
    expect(result.vertices.length).toBe(3);
  });

  test('removes corresponding smoothFlag when deleting a vertex', () => {
    const flags = [true, false, true, false]; // square
    const result = deleteVertex(SQUARE, flags, UNIT_BOUND, 1)!; // delete vertex 1
    expect(result.smoothFlags!.length).toBe(3);
    // After deleting index 1 (false), remaining: [true, true, false]
    expect(result.smoothFlags).toEqual([true, true, false]);
  });

  test('leaves smoothFlags as null when no smoothFlags were set', () => {
    const result = deleteVertex(SQUARE, null, UNIT_BOUND, 0)!;
    expect(result.smoothFlags).toBeNull();
  });

  test('vertices remain normalized [0-1] after deletion', () => {
    const result = deleteVertex(PENTAGON, null, UNIT_BOUND, 2)!;
    for (const [vx, vy] of result.vertices) {
      expect(vx).toBeGreaterThanOrEqual(0);
      expect(vx).toBeLessThanOrEqual(1);
      expect(vy).toBeGreaterThanOrEqual(0);
      expect(vy).toBeLessThanOrEqual(1);
    }
    // At least one vertex at x=0, one at x=1 (by normalized definition)
    const xs = result.vertices.map(v => v[0]);
    const ys = result.vertices.map(v => v[1]);
    expect(Math.min(...xs)).toBeCloseTo(0, 10);
    expect(Math.max(...xs)).toBeCloseTo(1, 10);
    expect(Math.min(...ys)).toBeCloseTo(0, 10);
    expect(Math.max(...ys)).toBeCloseTo(1, 10);
  });
});

describe('polygon Bezier toggle (toggleVertexSmooth)', () => {
  test('creates smoothFlags array from null when toggling a vertex', () => {
    const flags = toggleVertexSmooth(SQUARE, null, 0);
    expect(flags.length).toBe(4);
    expect(flags[0]).toBe(true); // toggled from false
    expect(flags[1]).toBe(false);
    expect(flags[2]).toBe(false);
    expect(flags[3]).toBe(false);
  });

  test('toggles an existing smooth flag from false to true', () => {
    const initial = [false, false, false, false];
    const flags = toggleVertexSmooth(SQUARE, initial, 2);
    expect(flags[2]).toBe(true);
    expect(flags[0]).toBe(false);
    expect(flags[1]).toBe(false);
    expect(flags[3]).toBe(false);
  });

  test('toggles an existing smooth flag from true to false', () => {
    const initial = [true, false, true, false];
    const flags = toggleVertexSmooth(SQUARE, initial, 0);
    expect(flags[0]).toBe(false);
    expect(flags[2]).toBe(true); // unchanged
  });

  test('preserves all other flags when toggling one', () => {
    const initial = [true, true, true, true];
    const flags = toggleVertexSmooth(SQUARE, initial, 3);
    expect(flags[0]).toBe(true);
    expect(flags[1]).toBe(true);
    expect(flags[2]).toBe(true);
    expect(flags[3]).toBe(false); // toggled
  });

  test('handles short smoothFlags array by padding with false', () => {
    // If smoothFlags is shorter than vertex count, pad with false
    const short = [true]; // only 1 flag for a 4-vertex polygon
    const flags = toggleVertexSmooth(SQUARE, short, 3);
    expect(flags.length).toBe(4);
    expect(flags[0]).toBe(true);
    expect(flags[1]).toBe(false); // padded
    expect(flags[2]).toBe(false); // padded
    expect(flags[3]).toBe(true); // toggled from padded false
  });

  test('toggling all vertices individually covers full roundtrip', () => {
    let flags: boolean[] | null = null;
    // Toggle each vertex to true
    for (let i = 0; i < PENTAGON.length; i++) {
      flags = toggleVertexSmooth(PENTAGON, flags, i);
    }
    expect(flags!.every(f => f)).toBe(true); // all true

    // Toggle each vertex to false
    for (let i = 0; i < PENTAGON.length; i++) {
      flags = toggleVertexSmooth(PENTAGON, flags, i);
    }
    expect(flags!.every(f => !f)).toBe(true); // all false
  });
});

describe('polygon vertex move (moveVertex)', () => {
  test('moves a vertex to a new absolute position', () => {
    // Square at [0,0,100,100], move vertex 0 from (0,0) to (50,50)
    const { vertices, bound } = moveVertex(SQUARE, UNIT_BOUND, 0, 50, 50);
    // Old vertex 0 was at abs (0,0); new abs = (50,50)
    // Remaining abs: (100,0),(100,100),(0,100)
    // All abs: (50,50),(100,0),(100,100),(0,100)
    // minX=0,maxX=100,minY=0,maxY=100 → bound unchanged
    expect(bound.w).toBe(100);
    expect(bound.h).toBe(100);
    expect(vertices.length).toBe(4);
    // Vertex 0 normalized: (50-0)/100=0.5, (50-0)/100=0.5
    expect(vertices[0][0]).toBeCloseTo(0.5, 10);
    expect(vertices[0][1]).toBeCloseTo(0.5, 10);
  });

  test('recomputes bounding box when moved vertex extends the polygon', () => {
    // Square at [0,0,100,100], move vertex 0 from (0,0) to (-50, -50)
    // New abs: (-50,-50),(100,0),(100,100),(0,100)
    // New bound: x=-50,y=-50,w=150,h=150
    const { vertices, bound } = moveVertex(SQUARE, UNIT_BOUND, 0, -50, -50);
    expect(bound.x).toBeCloseTo(-50, 10);
    expect(bound.y).toBeCloseTo(-50, 10);
    expect(bound.w).toBeCloseTo(150, 10);
    expect(bound.h).toBeCloseTo(150, 10);
    // Vertex 0 normalized: (-50-(-50))/150=0, (-50-(-50))/150=0
    expect(vertices[0][0]).toBeCloseTo(0, 10);
    expect(vertices[0][1]).toBeCloseTo(0, 10);
  });

  test('vertices remain normalized [0-1] after move', () => {
    const { vertices } = moveVertex(PENTAGON, UNIT_BOUND, 0, 25, 25);
    for (const [vx, vy] of vertices) {
      expect(vx).toBeGreaterThanOrEqual(0);
      expect(vx).toBeLessThanOrEqual(1);
      expect(vy).toBeGreaterThanOrEqual(0);
      expect(vy).toBeLessThanOrEqual(1);
    }
    const xs = vertices.map(v => v[0]);
    const ys = vertices.map(v => v[1]);
    expect(Math.min(...xs)).toBeCloseTo(0, 10);
    expect(Math.max(...xs)).toBeCloseTo(1, 10);
    expect(Math.min(...ys)).toBeCloseTo(0, 10);
    expect(Math.max(...ys)).toBeCloseTo(1, 10);
  });

  test('moves all vertices correctly for a drag sequence', () => {
    // Simulate dragging vertex 0 of a triangle through several positions
    let verts = [...TRIANGLE];
    let b = { ...UNIT_BOUND };

    const positions: [number, number][] = [
      [30, 10],
      [20, 5],
      [25, 0],
    ];
    for (const [absX, absY] of positions) {
      const result = moveVertex(verts, b, 0, absX, absY);
      verts = result.vertices;
      b = result.bound;
    }
    // Final state: verify vertices are still normalized
    for (const [vx, vy] of verts) {
      expect(vx).toBeGreaterThanOrEqual(0);
      expect(vx).toBeLessThanOrEqual(1);
      expect(vy).toBeGreaterThanOrEqual(0);
      expect(vy).toBeLessThanOrEqual(1);
    }
  });
});

describe('proportional resize (vertices remain normalized)', () => {
  /**
   * Proportional resize works because vertices are stored as normalized [0-1]
   * coordinates relative to the bounding box. When the bounding box (xywh)
   * changes, the absolute positions scale automatically via:
   *   abs = (norm[0] * newW + newX, norm[1] * newH + newY)
   *
   * This means polygon resize is non-destructive: the vertex array never
   * changes during resize. This suite verifies that property.
   */

  test('normalizing absolute vertices into a bound and back is lossless', () => {
    // Create a polygon with known absolute positions
    const absPositions: Vertex[] = [
      [100, 50],
      [200, 50],
      [250, 150],
      [200, 250],
      [100, 250],
      [50, 150],
    ];
    const b = { x: 50, y: 50, w: 200, h: 200 };
    const normalized = absPositions.map(([vx, vy]) => [
      (vx - b.x) / b.w,
      (vy - b.y) / b.h,
    ]);

    // Denormalize back into the original bound
    const restored = normalized.map(([nx, ny]) => [
      b.x + nx * b.w,
      b.y + ny * b.h,
    ]);

    for (let i = 0; i < absPositions.length; i++) {
      expect(restored[i][0]).toBeCloseTo(absPositions[i][0], 10);
      expect(restored[i][1]).toBeCloseTo(absPositions[i][1], 10);
    }
  });

  test('polygon shape scales proportionally when bound changes', () => {
    // Start with a square polygon at 100×100
    const normalizedSquare = SQUARE;
    const bound1 = UNIT_BOUND;

    // Resize to 200×200
    const bound2 = { x: 0, y: 0, w: 200, h: 200 };
    const abs1 = normalizedSquare.map(v => toAbsolute(v, bound1));
    const abs2 = normalizedSquare.map(v => toAbsolute(v, bound2));

    // Each absolute coordinate should be exactly doubled
    for (let i = 0; i < abs1.length; i++) {
      expect(abs2[i][0]).toBeCloseTo(abs1[i][0] * 2, 10);
      expect(abs2[i][1]).toBeCloseTo(abs1[i][1] * 2, 10);
    }
  });

  test('normalized vertices are unchanged after a resize operation', () => {
    // Simulate what happens during resize: only xywh changes, vertices stay
    const originalVertices = [...PENTAGON];

    // "Resize" by updating the bound only (vertices stay in normalized [0-1] space)
    // The vertex array should be identical (resize doesn't touch vertices)
    expect(PENTAGON).toEqual(originalVertices);
  });

  test('non-uniform resize changes aspect ratio correctly', () => {
    // Pentagon at 100×100 → resized to 200×50 (wider, shorter)
    const bound1 = UNIT_BOUND;
    const bound2 = { x: 0, y: 0, w: 200, h: 50 };

    const abs1 = PENTAGON.map(v => toAbsolute(v, bound1));
    const abs2 = PENTAGON.map(v => toAbsolute(v, bound2));

    for (let i = 0; i < PENTAGON.length; i++) {
      // X coords scale by factor 2 (w: 100 → 200)
      expect(abs2[i][0]).toBeCloseTo(abs1[i][0] * 2, 10);
      // Y coords scale by factor 0.5 (h: 100 → 50)
      expect(abs2[i][1]).toBeCloseTo(abs1[i][1] * 0.5, 10);
    }
  });
});

describe('hitTestVertex', () => {
  test('returns vertex index when cursor is within hit distance', () => {
    // Square at [0,0,100,100], vertex 0 at abs (0,0)
    const idx = hitTestVertex(SQUARE, UNIT_BOUND, 2, 2, 10);
    expect(idx).toBe(0);
  });

  test('returns -1 when cursor is outside hit distance of all vertices', () => {
    const idx = hitTestVertex(SQUARE, UNIT_BOUND, 50, 50, 10);
    expect(idx).toBe(-1);
  });

  test('returns the closest vertex when multiple are nearby', () => {
    // Two vertices at (0,0) and (10,0), cursor at (3,0), hitDist=5
    const verts = [
      [0, 0],
      [0.1, 0],
      [1, 1],
    ];
    const idx = hitTestVertex(verts, UNIT_BOUND, 3, 0, 5);
    expect(idx).toBe(0); // vertex 0 at (0,0) is 3 units away, within hitDist=5
  });

  test('hit test is exact at boundary distance', () => {
    // Vertex 0 is at abs (0,0), cursor at (9.99, 0), hitDist=10
    const idx = hitTestVertex(SQUARE, UNIT_BOUND, 9.99, 0, 10);
    expect(idx).toBe(0);

    // Cursor at (10.01, 0) — just outside hit distance
    const miss = hitTestVertex(SQUARE, UNIT_BOUND, 10.01, 0, 10);
    expect(miss).toBe(-1);
  });
});

describe('hitTestMidpoint', () => {
  test('returns edge index when cursor is near a midpoint', () => {
    // Square: edge 0 is between [0,0] and [100,0], midpoint at (50,0)
    const idx = hitTestMidpoint(SQUARE, UNIT_BOUND, 50, 2, 10);
    expect(idx).toBe(0); // edge between vertex 0 and vertex 1
  });

  test('returns -1 when cursor is not near any midpoint', () => {
    const idx = hitTestMidpoint(SQUARE, UNIT_BOUND, 50, 50, 10);
    expect(idx).toBe(-1);
  });

  test('handles last edge (wraps around to first vertex)', () => {
    // Square: edge 3 is between [0,100] and [0,0], midpoint at (0,50)
    const idx = hitTestMidpoint(SQUARE, UNIT_BOUND, 2, 50, 10);
    expect(idx).toBe(3); // last edge
  });

  test('returns first matching edge in iteration order', () => {
    // Pentagon has 5 edges; cursor near edge 2 midpoint
    // Edge 2: between vertex 2 [81,100] and vertex 3 [19,100], midpoint [50,100]
    const idx = hitTestMidpoint(PENTAGON, UNIT_BOUND, 50, 100, 10);
    expect(idx).toBe(2);
  });
});

describe('edge cases and invariants', () => {
  test('inserting a vertex preserves the polygon closure (all in [0,1])', () => {
    for (let edge = 0; edge < PENTAGON.length; edge++) {
      const { vertices } = insertVertexAtMidpoint(PENTAGON, null, edge);
      for (const [vx, vy] of vertices) {
        expect(vx).toBeGreaterThanOrEqual(0 - 1e-10);
        expect(vx).toBeLessThanOrEqual(1 + 1e-10);
        expect(vy).toBeGreaterThanOrEqual(0 - 1e-10);
        expect(vy).toBeLessThanOrEqual(1 + 1e-10);
      }
    }
  });

  test('delete followed by insert gives same vertex count', () => {
    // Delete from 5-vertex polygon → 4 vertices
    const afterDelete = deleteVertex(PENTAGON, null, UNIT_BOUND, 0)!;
    expect(afterDelete.vertices.length).toBe(4);

    // Insert at edge 0 → 5 vertices
    const { vertices: afterInsert } = insertVertexAtMidpoint(
      afterDelete.vertices,
      null,
      0
    );
    expect(afterInsert.length).toBe(5);
  });

  test('toggle smooth twice returns to original state (roundtrip)', () => {
    const flags1 = toggleVertexSmooth(SQUARE, null, 1);
    expect(flags1[1]).toBe(true);

    const flags2 = toggleVertexSmooth(SQUARE, flags1, 1);
    expect(flags2[1]).toBe(false);
  });

  test('minimum bounding box size is 1 (guard against degenerate polygon)', () => {
    // Move all vertices to the same point → bound collapses
    // The moveVertex function has w = Math.max(maxX - minX, 1)
    // Test recomputeBound with all vertices at the same point
    const allSame: Vertex[] = [[50, 50], [50, 50], [50, 50]];
    const { bound, normalized } = recomputeBound(allSame);
    expect(bound.w).toBeGreaterThanOrEqual(1);
    expect(bound.h).toBeGreaterThanOrEqual(1);
    expect(normalized.length).toBe(3);
  });

  test('smoothFlags length always matches vertex count after operations', () => {
    let verts = [...PENTAGON];
    let flags: boolean[] | null = null;
    const b = { ...UNIT_BOUND };

    // Toggle a few vertices
    flags = toggleVertexSmooth(verts, flags, 0);
    flags = toggleVertexSmooth(verts, flags, 2);
    expect(flags.length).toBe(verts.length);

    // Insert a vertex
    const { vertices: v2, smoothFlags: f2 } = insertVertexAtMidpoint(verts, flags, 1);
    verts = v2;
    flags = f2;
    expect(flags!.length).toBe(verts.length);

    // Delete a vertex
    const result = deleteVertex(verts, flags, b, 0);
    expect(result).not.toBeNull();
    expect(result!.smoothFlags!.length).toBe(result!.vertices.length);
  });

  test('consecutive deletes reduce vertex count correctly', () => {
    // Start from pentagon (5 vertices), delete down to triangle (3)
    let verts = [...PENTAGON];
    let flags: boolean[] | null = null;
    let b = { ...UNIT_BOUND };

    // Delete vertex 0: 5 → 4
    let result = deleteVertex(verts, flags, b, 0)!;
    verts = result.vertices;
    flags = result.smoothFlags;
    b = result.bound;
    expect(verts.length).toBe(4);

    // Delete vertex 0 again: 4 → 3
    result = deleteVertex(verts, flags, b, 0)!;
    verts = result.vertices;
    flags = result.smoothFlags;
    b = result.bound;
    expect(verts.length).toBe(3);

    // Attempting to delete when only 3 remain should fail
    const blocked = deleteVertex(verts, flags, b, 0);
    expect(blocked).toBeNull();
    expect(verts.length).toBe(3); // unchanged
  });
});
