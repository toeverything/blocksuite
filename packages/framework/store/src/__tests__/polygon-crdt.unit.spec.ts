import { describe, expect, test } from 'vitest';
import * as Y from 'yjs';

import { createYProxy } from '../reactive/index.js';

/**
 * Tests for real-time collaboration correctness of polygon vertex data.
 *
 * Polygon vertices are stored as nested arrays (number[][]) inside a Y.Map,
 * matching how ShapeElementModel stores them via the @field() decorator.
 * These tests verify that concurrent edits from multiple CRDT peers
 * converge to a consistent state.
 */

/**
 * Helper: create a peer Y.Doc with a shape element map containing polygon vertices.
 * Mimics how ShapeElementModel stores data in Yjs.
 */
function createPeerWithPolygon(
  vertices: number[][],
  options?: { shapeType?: string }
) {
  const doc = new Y.Doc();
  const elementsMap = doc.getMap('elements');
  const shapeMap = new Y.Map();

  shapeMap.set('shapeType', options?.shapeType ?? 'polygon');
  shapeMap.set('xywh', '[0,0,200,200]');

  // Store vertices as a Y.Array of Y.Arrays (matching how createYProxy handles nested arrays)
  const yVertices = new Y.Array();
  for (const vertex of vertices) {
    const yVertex = new Y.Array();
    yVertex.push(vertex);
    yVertices.push([yVertex]);
  }
  shapeMap.set('vertices', yVertices);

  elementsMap.set('shape:0', shapeMap);

  return { doc, elementsMap, shapeMap, yVertices };
}

/**
 * Helper: sync two Y.Docs bidirectionally.
 */
function syncDocs(doc1: Y.Doc, doc2: Y.Doc) {
  const update1 = Y.encodeStateAsUpdate(doc1);
  const update2 = Y.encodeStateAsUpdate(doc2);
  Y.applyUpdate(doc2, update1);
  Y.applyUpdate(doc1, update2);
}

/**
 * Helper: sync doc1 → doc2 (one-way).
 */
function syncOneWay(source: Y.Doc, target: Y.Doc) {
  const update = Y.encodeStateAsUpdate(source);
  Y.applyUpdate(target, update);
}

/**
 * Helper: extract vertices from a shape Y.Map as plain arrays.
 */
function getVerticesFromMap(shapeMap: Y.Map<unknown>): number[][] {
  const yVertices = shapeMap.get('vertices') as Y.Array<Y.Array<number>>;
  if (!yVertices) return [];
  return yVertices.toJSON() as number[][];
}

describe('polygon CRDT convergence', () => {
  describe('basic sync', () => {
    test('vertices sync from one peer to another', () => {
      const triangleVertices = [
        [0.5, 0],
        [1, 1],
        [0, 1],
      ];

      const peer1 = createPeerWithPolygon(triangleVertices);

      // Create peer2 by applying peer1's state
      const peer2Doc = new Y.Doc();
      syncOneWay(peer1.doc, peer2Doc);

      const peer2Elements = peer2Doc.getMap('elements');
      const peer2Shape = peer2Elements.get('shape:0') as Y.Map<unknown>;

      expect(peer2Shape).toBeDefined();
      expect(peer2Shape.get('shapeType')).toBe('polygon');
      expect(getVerticesFromMap(peer2Shape)).toEqual(triangleVertices);
    });

    test('vertex modifications sync between peers', () => {
      const initialVertices = [
        [0.5, 0],
        [1, 1],
        [0, 1],
      ];

      const peer1 = createPeerWithPolygon(initialVertices);
      const peer2Doc = new Y.Doc();
      syncOneWay(peer1.doc, peer2Doc);

      // Peer1 modifies vertex 0 position (drag vertex)
      const peer1Vertices = peer1.shapeMap.get('vertices') as Y.Array<
        Y.Array<number>
      >;
      peer1.doc.transact(() => {
        const vertex0 = peer1Vertices.get(0) as Y.Array<number>;
        vertex0.delete(0, vertex0.length);
        vertex0.push([0.6, 0.1]);
      });

      // Sync peer1 → peer2
      syncOneWay(peer1.doc, peer2Doc);

      const peer2Shape = peer2Doc
        .getMap('elements')
        .get('shape:0') as Y.Map<unknown>;
      const peer2Vertices = getVerticesFromMap(peer2Shape);
      expect(peer2Vertices[0]).toEqual([0.6, 0.1]);
      expect(peer2Vertices[1]).toEqual([1, 1]);
      expect(peer2Vertices[2]).toEqual([0, 1]);
    });
  });

  describe('concurrent edits', () => {
    test('concurrent vertex position edits converge to same state', () => {
      const initialVertices = [
        [0.5, 0],
        [1, 1],
        [0, 1],
      ];

      // Set up two peers with same initial state
      const peer1 = createPeerWithPolygon(initialVertices);
      const peer2Doc = new Y.Doc();
      syncOneWay(peer1.doc, peer2Doc);

      const peer2Elements = peer2Doc.getMap('elements');
      const peer2Shape = peer2Elements.get('shape:0') as Y.Map<unknown>;
      const peer2VerticesY = peer2Shape.get('vertices') as Y.Array<
        Y.Array<number>
      >;

      // Peer1 edits vertex 0 (drag it to a new position)
      peer1.doc.transact(() => {
        const vertex0 = (
          peer1.shapeMap.get('vertices') as Y.Array<Y.Array<number>>
        ).get(0) as Y.Array<number>;
        vertex0.delete(0, vertex0.length);
        vertex0.push([0.3, 0.2]);
      });

      // Peer2 edits vertex 2 concurrently (drag a different vertex)
      peer2Doc.transact(() => {
        const vertex2 = peer2VerticesY.get(2) as Y.Array<number>;
        vertex2.delete(0, vertex2.length);
        vertex2.push([0.1, 0.9]);
      });

      // Sync both ways
      syncDocs(peer1.doc, peer2Doc);

      // Both peers should converge to the same state
      const peer1Final = getVerticesFromMap(peer1.shapeMap);
      const peer2Final = getVerticesFromMap(peer2Shape);

      expect(peer1Final).toEqual(peer2Final);
      // Peer1's edit to vertex 0
      expect(peer1Final[0]).toEqual([0.3, 0.2]);
      // Vertex 1 unchanged
      expect(peer1Final[1]).toEqual([1, 1]);
      // Peer2's edit to vertex 2
      expect(peer1Final[2]).toEqual([0.1, 0.9]);
    });

    test('concurrent edits to the SAME vertex converge deterministically', () => {
      const initialVertices = [
        [0.5, 0],
        [1, 1],
        [0, 1],
      ];

      const peer1 = createPeerWithPolygon(initialVertices);
      const peer2Doc = new Y.Doc();
      syncOneWay(peer1.doc, peer2Doc);

      const peer2Shape = peer2Doc
        .getMap('elements')
        .get('shape:0') as Y.Map<unknown>;
      const peer2VerticesY = peer2Shape.get('vertices') as Y.Array<
        Y.Array<number>
      >;

      // Both peers concurrently edit vertex 0
      peer1.doc.transact(() => {
        const vertex0 = (
          peer1.shapeMap.get('vertices') as Y.Array<Y.Array<number>>
        ).get(0) as Y.Array<number>;
        vertex0.delete(0, vertex0.length);
        vertex0.push([0.3, 0.2]);
      });

      peer2Doc.transact(() => {
        const vertex0 = peer2VerticesY.get(0) as Y.Array<number>;
        vertex0.delete(0, vertex0.length);
        vertex0.push([0.7, 0.8]);
      });

      // Sync both ways
      syncDocs(peer1.doc, peer2Doc);

      // Both should converge to the same state (Yjs determines winner)
      const peer1Final = getVerticesFromMap(peer1.shapeMap);
      const peer2Final = getVerticesFromMap(peer2Shape);

      expect(peer1Final).toEqual(peer2Final);
      // Both vertex 0 values should be identical (exact value depends on Yjs conflict resolution)
      expect(peer1Final[0]).toEqual(peer2Final[0]);
    });

    test('concurrent vertex addition and removal converge', () => {
      const initialVertices = [
        [0.25, 0],
        [0.75, 0],
        [1, 0.5],
        [0.5, 1],
        [0, 0.5],
      ];

      const peer1 = createPeerWithPolygon(initialVertices);
      const peer2Doc = new Y.Doc();
      syncOneWay(peer1.doc, peer2Doc);

      const peer2Shape = peer2Doc
        .getMap('elements')
        .get('shape:0') as Y.Map<unknown>;

      // Peer1 adds a new vertex at the end
      peer1.doc.transact(() => {
        const vertices = peer1.shapeMap.get('vertices') as Y.Array<
          Y.Array<number>
        >;
        const newVertex = new Y.Array<number>();
        newVertex.push([0.1, 0.3]);
        vertices.push([newVertex]);
      });

      // Peer2 removes vertex at index 2
      peer2Doc.transact(() => {
        const vertices = peer2Shape.get('vertices') as Y.Array<
          Y.Array<number>
        >;
        vertices.delete(2, 1);
      });

      // Sync both ways
      syncDocs(peer1.doc, peer2Doc);

      // Both peers should converge
      const peer1Final = getVerticesFromMap(peer1.shapeMap);
      const peer2Final = getVerticesFromMap(peer2Shape);

      expect(peer1Final).toEqual(peer2Final);
      // Original had 5 vertices, one removed (-1), one added (+1) = 5
      expect(peer1Final.length).toBe(5);
    });
  });

  describe('property-level updates via Y.Map', () => {
    test('replacing entire vertices array syncs correctly', () => {
      const initialVertices = [
        [0.5, 0],
        [1, 1],
        [0, 1],
      ];

      const peer1 = createPeerWithPolygon(initialVertices);
      const peer2Doc = new Y.Doc();
      syncOneWay(peer1.doc, peer2Doc);

      // Peer1 replaces the entire vertices array (like when polygon is rebuilt)
      const newVertices = [
        [0.2, 0],
        [0.8, 0],
        [1, 0.6],
        [0.5, 1],
        [0, 0.6],
      ];
      peer1.doc.transact(() => {
        const newYVertices = new Y.Array();
        for (const v of newVertices) {
          const yv = new Y.Array<number>();
          yv.push(v);
          newYVertices.push([yv]);
        }
        peer1.shapeMap.set('vertices', newYVertices);
      });

      syncOneWay(peer1.doc, peer2Doc);

      const peer2Shape = peer2Doc
        .getMap('elements')
        .get('shape:0') as Y.Map<unknown>;
      expect(getVerticesFromMap(peer2Shape)).toEqual(newVertices);
    });

    test('smoothFlags sync alongside vertices', () => {
      const vertices = [
        [0.5, 0],
        [1, 1],
        [0, 1],
      ];
      const peer1 = createPeerWithPolygon(vertices);

      // Add smoothFlags
      peer1.doc.transact(() => {
        const flags = new Y.Array<boolean>();
        flags.push([false, true, false]);
        peer1.shapeMap.set('smoothFlags', flags);
      });

      const peer2Doc = new Y.Doc();
      syncOneWay(peer1.doc, peer2Doc);

      const peer2Shape = peer2Doc
        .getMap('elements')
        .get('shape:0') as Y.Map<unknown>;
      const peer2Flags = peer2Shape.get('smoothFlags') as Y.Array<boolean>;
      expect(peer2Flags.toJSON()).toEqual([false, true, false]);

      // Peer1 toggles a smooth flag
      peer1.doc.transact(() => {
        const flags = peer1.shapeMap.get('smoothFlags') as Y.Array<boolean>;
        flags.delete(0, 1);
        flags.insert(0, [true]);
      });

      syncOneWay(peer1.doc, peer2Doc);

      const updatedFlags = (
        peer2Shape.get('smoothFlags') as Y.Array<boolean>
      ).toJSON();
      expect(updatedFlags).toEqual([true, true, false]);
    });

    test('concurrent smoothFlags and vertex edits converge', () => {
      const vertices = [
        [0.5, 0],
        [1, 1],
        [0, 1],
      ];
      const peer1 = createPeerWithPolygon(vertices);

      // Set initial smoothFlags
      peer1.doc.transact(() => {
        const flags = new Y.Array<boolean>();
        flags.push([false, false, false]);
        peer1.shapeMap.set('smoothFlags', flags);
      });

      const peer2Doc = new Y.Doc();
      syncOneWay(peer1.doc, peer2Doc);

      const peer2Shape = peer2Doc
        .getMap('elements')
        .get('shape:0') as Y.Map<unknown>;

      // Peer1 moves vertex 1
      peer1.doc.transact(() => {
        const verts = peer1.shapeMap.get('vertices') as Y.Array<
          Y.Array<number>
        >;
        const v1 = verts.get(1) as Y.Array<number>;
        v1.delete(0, v1.length);
        v1.push([0.9, 0.8]);
      });

      // Peer2 toggles smoothFlag for vertex 2
      peer2Doc.transact(() => {
        const flags = peer2Shape.get('smoothFlags') as Y.Array<boolean>;
        flags.delete(2, 1);
        flags.insert(2, [true]);
      });

      // Sync both ways
      syncDocs(peer1.doc, peer2Doc);

      const peer1Vertices = getVerticesFromMap(peer1.shapeMap);
      const peer2Vertices = getVerticesFromMap(peer2Shape);
      expect(peer1Vertices).toEqual(peer2Vertices);
      expect(peer1Vertices[1]).toEqual([0.9, 0.8]);

      const peer1Flags = (
        peer1.shapeMap.get('smoothFlags') as Y.Array<boolean>
      ).toJSON();
      const peer2Flags = (
        peer2Shape.get('smoothFlags') as Y.Array<boolean>
      ).toJSON();
      expect(peer1Flags).toEqual(peer2Flags);
      expect(peer1Flags[2]).toBe(true);
    });
  });

  describe('three-peer convergence', () => {
    test('three peers editing different vertices all converge', () => {
      const initialVertices = [
        [0.2, 0],
        [0.8, 0],
        [1, 0.6],
        [0.5, 1],
        [0, 0.6],
      ];

      const peer1 = createPeerWithPolygon(initialVertices);
      const peer2Doc = new Y.Doc();
      const peer3Doc = new Y.Doc();

      // Sync initial state to all peers
      syncOneWay(peer1.doc, peer2Doc);
      syncOneWay(peer1.doc, peer3Doc);

      const peer2Shape = peer2Doc
        .getMap('elements')
        .get('shape:0') as Y.Map<unknown>;
      const peer3Shape = peer3Doc
        .getMap('elements')
        .get('shape:0') as Y.Map<unknown>;

      // All three peers edit different vertices concurrently
      peer1.doc.transact(() => {
        const verts = peer1.shapeMap.get('vertices') as Y.Array<
          Y.Array<number>
        >;
        const v0 = verts.get(0) as Y.Array<number>;
        v0.delete(0, v0.length);
        v0.push([0.25, 0.05]);
      });

      peer2Doc.transact(() => {
        const verts = peer2Shape.get('vertices') as Y.Array<Y.Array<number>>;
        const v2 = verts.get(2) as Y.Array<number>;
        v2.delete(0, v2.length);
        v2.push([0.95, 0.55]);
      });

      peer3Doc.transact(() => {
        const verts = peer3Shape.get('vertices') as Y.Array<Y.Array<number>>;
        const v4 = verts.get(4) as Y.Array<number>;
        v4.delete(0, v4.length);
        v4.push([0.05, 0.55]);
      });

      // Full mesh sync: each pair syncs
      syncDocs(peer1.doc, peer2Doc);
      syncDocs(peer1.doc, peer3Doc);
      syncDocs(peer2Doc, peer3Doc);

      // All three peers should converge
      const peer1Final = getVerticesFromMap(peer1.shapeMap);
      const peer2Final = getVerticesFromMap(peer2Shape);
      const peer3Final = getVerticesFromMap(peer3Shape);

      expect(peer1Final).toEqual(peer2Final);
      expect(peer2Final).toEqual(peer3Final);

      // Verify each peer's edit is reflected
      expect(peer1Final[0]).toEqual([0.25, 0.05]);
      expect(peer1Final[2]).toEqual([0.95, 0.55]);
      expect(peer1Final[4]).toEqual([0.05, 0.55]);
      // Unmodified vertices remain
      expect(peer1Final[1]).toEqual([0.8, 0]);
      expect(peer1Final[3]).toEqual([0.5, 1]);
    });
  });

  describe('createYProxy integration', () => {
    test('polygon vertices via createYProxy sync like @field() decorator', () => {
      // This test simulates how @field() works: storing data in Y.Map
      // and accessing it via createYProxy
      const doc1 = new Y.Doc();
      const map1 = doc1.getMap('shape');

      // Set initial polygon data as plain objects (createYProxy converts them)
      doc1.transact(() => {
        map1.set('shapeType', 'polygon');
        map1.set(
          'vertices',
          Y.Array.from([
            Y.Array.from([0.5, 0]),
            Y.Array.from([1, 1]),
            Y.Array.from([0, 1]),
          ])
        );
      });

      const proxy1 = createYProxy<Record<string, any>>(map1);

      // Verify proxy reads correctly
      expect(proxy1.shapeType).toBe('polygon');
      expect(proxy1.vertices.length).toBe(3);

      // Create peer2 and sync
      const doc2 = new Y.Doc();
      syncOneWay(doc1, doc2);

      const map2 = doc2.getMap('shape');
      const proxy2 = createYProxy<Record<string, any>>(map2);

      expect(proxy2.shapeType).toBe('polygon');
      expect(proxy2.vertices.length).toBe(3);

      // Modify via proxy on peer1 (simulates user dragging a vertex)
      doc1.transact(() => {
        const verts = map1.get('vertices') as Y.Array<Y.Array<number>>;
        const v0 = verts.get(0);
        v0.delete(0, v0.length);
        v0.push([0.6, 0.1]);
      });

      syncOneWay(doc1, doc2);

      // Peer2 should see the update
      const v2Verts = (map2.get('vertices') as Y.Array<Y.Array<number>>).toJSON();
      expect(v2Verts[0]).toEqual([0.6, 0.1]);
    });

    test('xywh and vertices update atomically within transaction', () => {
      // When a polygon is resized, both xywh and vertices may be updated
      const doc1 = new Y.Doc();
      const map1 = doc1.getMap('shape');

      doc1.transact(() => {
        map1.set('shapeType', 'polygon');
        map1.set('xywh', '[0,0,200,200]');
        map1.set(
          'vertices',
          Y.Array.from([
            Y.Array.from([0.5, 0]),
            Y.Array.from([1, 1]),
            Y.Array.from([0, 1]),
          ])
        );
      });

      const doc2 = new Y.Doc();
      syncOneWay(doc1, doc2);

      // Track updates received by peer2
      let updateCount = 0;
      doc2.on('update', () => {
        updateCount++;
      });

      // Peer1: resize polygon (update xywh) and adjust vertices in a single transaction
      doc1.transact(() => {
        map1.set('xywh', '[10,10,300,300]');
        // Vertices stay normalized but we might adjust them for a non-uniform resize
        const verts = map1.get('vertices') as Y.Array<Y.Array<number>>;
        const v1 = verts.get(1);
        v1.delete(0, v1.length);
        v1.push([0.9, 0.95]);
      });

      syncOneWay(doc1, doc2);

      const map2 = doc2.getMap('shape');
      expect(map2.get('xywh')).toBe('[10,10,300,300]');
      const v2Verts = (map2.get('vertices') as Y.Array<Y.Array<number>>).toJSON();
      expect(v2Verts[1]).toEqual([0.9, 0.95]);
    });
  });

  describe('edge cases', () => {
    test('empty polygon (no vertices) syncs correctly', () => {
      const doc1 = new Y.Doc();
      const map1 = doc1.getMap('shape');
      doc1.transact(() => {
        map1.set('shapeType', 'polygon');
        map1.set('vertices', new Y.Array());
      });

      const doc2 = new Y.Doc();
      syncOneWay(doc1, doc2);

      const map2 = doc2.getMap('shape');
      const verts = (map2.get('vertices') as Y.Array<unknown>).toJSON();
      expect(verts).toEqual([]);
    });

    test('polygon with many vertices (complex shape) syncs correctly', () => {
      // Star polygon with 10 vertices
      const starVertices: number[][] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
        const r = i % 2 === 0 ? 0.5 : 0.2;
        starVertices.push([0.5 + r * Math.cos(angle), 0.5 + r * Math.sin(angle)]);
      }

      const peer1 = createPeerWithPolygon(starVertices);
      const peer2Doc = new Y.Doc();
      syncOneWay(peer1.doc, peer2Doc);

      const peer2Shape = peer2Doc
        .getMap('elements')
        .get('shape:0') as Y.Map<unknown>;
      const synced = getVerticesFromMap(peer2Shape);

      expect(synced.length).toBe(10);
      for (let i = 0; i < 10; i++) {
        expect(synced[i][0]).toBeCloseTo(starVertices[i][0], 10);
        expect(synced[i][1]).toBeCloseTo(starVertices[i][1], 10);
      }
    });

    test('rapid sequential edits from one peer sync correctly', () => {
      const peer1 = createPeerWithPolygon([
        [0.5, 0],
        [1, 1],
        [0, 1],
      ]);

      // Simulate rapid dragging: many small position updates
      for (let i = 0; i < 20; i++) {
        peer1.doc.transact(() => {
          const verts = peer1.shapeMap.get('vertices') as Y.Array<
            Y.Array<number>
          >;
          const v0 = verts.get(0) as Y.Array<number>;
          v0.delete(0, v0.length);
          v0.push([0.5 + i * 0.01, i * 0.02]);
        });
      }

      const peer2Doc = new Y.Doc();
      syncOneWay(peer1.doc, peer2Doc);

      const peer2Shape = peer2Doc
        .getMap('elements')
        .get('shape:0') as Y.Map<unknown>;
      const synced = getVerticesFromMap(peer2Shape);

      // Should reflect the final state after all 20 edits
      expect(synced[0][0]).toBeCloseTo(0.5 + 19 * 0.01, 10);
      expect(synced[0][1]).toBeCloseTo(19 * 0.02, 10);
    });
  });
});
