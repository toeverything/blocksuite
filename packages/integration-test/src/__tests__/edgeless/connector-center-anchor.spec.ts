import type { EdgelessRootBlockComponent } from '@labre/affine/blocks/root';
import {
  type ConnectorElementModel,
  ConnectorMode,
  type ShapeElementModel,
  ShapeType,
} from '@labre/affine/model';
import { EditPropsStore } from '@labre/affine/shared/services';
import {
  getAnchors,
  isCenterAnchorEligible,
  isCenterAnchorEnabled,
} from '@labre/affine-gfx-connector';
import { Bound, polygonCentroid } from '@labre/global/gfx';
import type { BlockStdScope } from '@labre/std';
import { beforeEach, describe, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { getDocRootBlock, getSurface } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

describe('Connector center anchor', () => {
  let edgelessRoot!: EdgelessRootBlockComponent;
  let service!: EdgelessRootBlockComponent['service'];
  let std!: BlockStdScope;

  beforeEach(async () => {
    localStorage.removeItem('blocksuite:connector:centerAnchor');
    const cleanup = await setupEditor('edgeless');
    edgelessRoot = getDocRootBlock(window.doc, window.editor, 'edgeless');
    service = edgelessRoot.service;
    std = edgelessRoot.std;
    return cleanup;
  });

  test('eligible shapes: Rect, Ellipse, Diamond, Triangle', () => {
    const eligibleTypes = [
      ShapeType.Rect,
      ShapeType.Ellipse,
      ShapeType.Diamond,
      ShapeType.Triangle,
    ];

    for (const shapeType of eligibleTypes) {
      const id = service.crud.addElement('shape', { shapeType });
      if (!id) throw new Error(`Failed to create shape ${shapeType}`);
      const shape = service.crud.getElementById(id) as ShapeElementModel;
      expect(isCenterAnchorEligible(shape)).toBe(true);
    }
  });

  test('getAnchors returns 5 anchors with center', () => {
    const id = service.crud.addElement('shape', {
      shapeType: ShapeType.Rect,
      xywh: '[0,0,100,100]',
    });
    if (!id) throw new Error('Failed to create shape');
    const shape = service.crud.getElementById(id) as ShapeElementModel;

    const anchors = getAnchors(shape, true);
    expect(anchors.length).toBe(5);

    const lastAnchor = anchors[anchors.length - 1];
    expect(lastAnchor.coord[0]).toBeCloseTo(0.5, 1);
    expect(lastAnchor.coord[1]).toBeCloseTo(0.5, 1);
  });

  test('getAnchors returns 4 anchors without center', () => {
    const id = service.crud.addElement('shape', {
      shapeType: ShapeType.Rect,
      xywh: '[0,0,100,100]',
    });
    if (!id) throw new Error('Failed to create shape');
    const shape = service.crud.getElementById(id) as ShapeElementModel;

    const anchors = getAnchors(shape, false);
    expect(anchors.length).toBe(4);
  });

  test('EditPropsStore toggle for connectorCenterAnchor', () => {
    const store = std.get(EditPropsStore);

    // Default should be true (enabled)
    expect(store.getStorage('connectorCenterAnchor') ?? true).toBe(true);
    expect(isCenterAnchorEnabled(std)).toBe(true);

    // Disable center anchor
    store.setStorage('connectorCenterAnchor', false);
    expect(isCenterAnchorEnabled(std)).toBe(false);

    // Re-enable
    store.setStorage('connectorCenterAnchor', true);
    expect(isCenterAnchorEnabled(std)).toBe(true);
  });

  test('center-anchored connector creates a valid path', async () => {
    const shape1Id = service.crud.addElement('shape', {
      shapeType: ShapeType.Rect,
      xywh: '[0,0,100,100]',
    });
    const shape2Id = service.crud.addElement('shape', {
      shapeType: ShapeType.Rect,
      xywh: '[300,300,100,100]',
    });
    if (!shape1Id || !shape2Id) throw new Error('Failed to create shapes');

    const connId = service.crud.addElement('connector', {
      mode: ConnectorMode.Orthogonal,
      source: { id: shape1Id, position: [0.5, 0.5] },
      target: { id: shape2Id, position: [0.5, 0.5] },
    });
    if (!connId) throw new Error('Failed to create connector');

    await wait(200);

    const connector = service.crud.getElementById(
      connId
    ) as ConnectorElementModel;
    expect(connector.path.length).toBeGreaterThan(0);
  });

  test('endpoint on perimeter, not at shape center', async () => {
    const shape1Id = service.crud.addElement('shape', {
      shapeType: ShapeType.Rect,
      xywh: '[0,0,100,100]',
    });
    const shape2Id = service.crud.addElement('shape', {
      shapeType: ShapeType.Rect,
      xywh: '[300,300,100,100]',
    });
    if (!shape1Id || !shape2Id) throw new Error('Failed to create shapes');

    const connId = service.crud.addElement('connector', {
      mode: ConnectorMode.Straight,
      source: { id: shape1Id, position: [0.5, 0.5] },
      target: { id: shape2Id, position: [0.5, 0.5] },
    });
    if (!connId) throw new Error('Failed to create connector');

    await wait(200);

    const connector = service.crud.getElementById(
      connId
    ) as ConnectorElementModel;
    const path = connector.path;
    expect(path.length).toBeGreaterThan(0);

    const connBound = Bound.deserialize(connector.xywh);

    // First point of the path (absolute coords)
    const firstX = path[0][0] + connBound.x;
    const firstY = path[0][1] + connBound.y;

    // Center of shape1 is (50, 50)
    const shape1CenterX = 50;
    const shape1CenterY = 50;

    // The endpoint should NOT be exactly at the shape center
    // (it should be on the perimeter)
    const isAtCenter =
      Math.abs(firstX - shape1CenterX) < 1 &&
      Math.abs(firstY - shape1CenterY) < 1;
    expect(isAtCenter).toBe(false);
  });

  test('routing modes with center anchor all produce valid paths', async () => {
    const modes = [
      ConnectorMode.Straight,
      ConnectorMode.Orthogonal,
      ConnectorMode.Curve,
    ];

    for (const mode of modes) {
      const shape1Id = service.crud.addElement('shape', {
        shapeType: ShapeType.Rect,
        xywh: '[0,0,100,100]',
      });
      const shape2Id = service.crud.addElement('shape', {
        shapeType: ShapeType.Rect,
        xywh: '[300,300,100,100]',
      });
      if (!shape1Id || !shape2Id) throw new Error('Failed to create shapes');

      const connId = service.crud.addElement('connector', {
        mode,
        source: { id: shape1Id, position: [0.5, 0.5] },
        target: { id: shape2Id, position: [0.5, 0.5] },
      });
      if (!connId) throw new Error('Failed to create connector');

      await wait(200);

      const connector = service.crud.getElementById(
        connId
      ) as ConnectorElementModel;
      expect(connector.path.length).toBeGreaterThan(0);
    }
  });

  test('two shapes both center-anchored connect correctly', async () => {
    const shape1Id = service.crud.addElement('shape', {
      shapeType: ShapeType.Ellipse,
      xywh: '[0,0,120,80]',
    });
    const shape2Id = service.crud.addElement('shape', {
      shapeType: ShapeType.Diamond,
      xywh: '[400,200,120,80]',
    });
    if (!shape1Id || !shape2Id) throw new Error('Failed to create shapes');

    const connId = service.crud.addElement('connector', {
      mode: ConnectorMode.Orthogonal,
      source: { id: shape1Id, position: [0.5, 0.5] },
      target: { id: shape2Id, position: [0.5, 0.5] },
    });
    if (!connId) throw new Error('Failed to create connector');

    await wait(200);

    const connector = service.crud.getElementById(
      connId
    ) as ConnectorElementModel;
    expect(connector.path.length).toBeGreaterThan(0);
    expect(connector.source.id).toBe(shape1Id);
    expect(connector.target.id).toBe(shape2Id);
  });

  // --- Polygon (freeshape) center anchor ---

  // Asymmetric right-triangle polygon: centroid = (1/3, 1/3), clearly NOT the
  // bounding-box center [0.5, 0.5].
  const TRI_VERTS = [
    [0, 0],
    [1, 0],
    [0, 1],
  ];

  const addPolygon = (vertices: number[][], extra: Record<string, unknown> = {}) => {
    const id = service.crud.addElement('shape', {
      shapeType: ShapeType.Polygon,
      xywh: '[0,0,100,100]',
      vertices,
      ...extra,
    });
    if (!id) throw new Error('Failed to create polygon');
    return id;
  };

  test('polygon is center-anchor eligible', () => {
    const shape = service.crud.getElementById(
      addPolygon(TRI_VERTS)
    ) as ShapeElementModel;
    expect(isCenterAnchorEligible(shape)).toBe(true);
  });

  test('getAnchors adds the geometric centroid for a polygon (2N+1)', () => {
    const shape = service.crud.getElementById(
      addPolygon(TRI_VERTS)
    ) as ShapeElementModel;

    const withCenter = getAnchors(shape, true);
    expect(withCenter.length).toBe(TRI_VERTS.length * 2 + 1);

    const centroid = polygonCentroid(TRI_VERTS);
    const last = withCenter[withCenter.length - 1];
    expect(last.coord[0]).toBeCloseTo(centroid[0], 5);
    expect(last.coord[1]).toBeCloseTo(centroid[1], 5);

    // The centroid must NOT be the bounding-box center [0.5, 0.5].
    const isBboxCenter =
      Math.abs(last.coord[0] - 0.5) < 0.01 &&
      Math.abs(last.coord[1] - 0.5) < 0.01;
    expect(isBboxCenter).toBe(false);

    // Without the center flag, no centroid anchor is emitted.
    const withoutCenter = getAnchors(shape, false);
    expect(withoutCenter.length).toBe(TRI_VERTS.length * 2);
  });

  test('toggle off removes the polygon centroid anchor', () => {
    const store = std.get(EditPropsStore);
    store.setStorage('connectorCenterAnchor', false);

    const shape = service.crud.getElementById(
      addPolygon(TRI_VERTS)
    ) as ShapeElementModel;
    const anchors = getAnchors(shape, isCenterAnchorEnabled(std));
    expect(anchors.length).toBe(TRI_VERTS.length * 2);
  });

  test('connector to polygon center terminates on an edge, not at the centroid', async () => {
    const rectId = service.crud.addElement('shape', {
      shapeType: ShapeType.Rect,
      xywh: '[300,300,100,100]',
    });
    const polyId = addPolygon(TRI_VERTS);
    if (!rectId) throw new Error('Failed to create rect');

    const centroid = polygonCentroid(TRI_VERTS);
    const connId = service.crud.addElement('connector', {
      mode: ConnectorMode.Straight,
      source: { id: rectId, position: [0.5, 0.5] },
      target: { id: polyId, position: [centroid[0], centroid[1]] },
    });
    if (!connId) throw new Error('Failed to create connector');
    await wait(200);

    const connector = service.crud.getElementById(
      connId
    ) as ConnectorElementModel;
    const poly = service.crud.getElementById(polyId) as ShapeElementModel;
    expect(connector.path.length).toBeGreaterThan(0);

    const connBound = Bound.deserialize(connector.xywh);
    const last = connector.path[connector.path.length - 1];
    const end: [number, number] = [
      last[0] + connBound.x,
      last[1] + connBound.y,
    ];

    // polygon bound is [0,0,100,100] => absolute centroid
    const centroidAbs = [centroid[0] * 100, centroid[1] * 100];
    const atCentroid =
      Math.abs(end[0] - centroidAbs[0]) < 1 &&
      Math.abs(end[1] - centroidAbs[1]) < 1;
    expect(atCentroid).toBe(false);

    // The endpoint must lie on the polygon boundary.
    const nearest = poly.getNearestPoint(end);
    const dist = Math.hypot(end[0] - nearest[0], end[1] - nearest[1]);
    expect(dist).toBeLessThan(2);
  });

  test('rotated polygon: center-anchored endpoint stays on the (rotated) edge', async () => {
    const rectId = service.crud.addElement('shape', {
      shapeType: ShapeType.Rect,
      xywh: '[400,0,100,100]',
    });
    const polyId = addPolygon(TRI_VERTS, { rotate: 30 });
    if (!rectId) throw new Error('Failed to create rect');

    const centroid = polygonCentroid(TRI_VERTS);
    const connId = service.crud.addElement('connector', {
      mode: ConnectorMode.Straight,
      source: { id: rectId, position: [0.5, 0.5] },
      target: { id: polyId, position: [centroid[0], centroid[1]] },
    });
    if (!connId) throw new Error('Failed to create connector');
    await wait(200);

    const connector = service.crud.getElementById(
      connId
    ) as ConnectorElementModel;
    const poly = service.crud.getElementById(polyId) as ShapeElementModel;
    expect(connector.path.length).toBeGreaterThan(0);

    const connBound = Bound.deserialize(connector.xywh);
    const last = connector.path[connector.path.length - 1];
    const end: [number, number] = [
      last[0] + connBound.x,
      last[1] + connBound.y,
    ];
    const nearest = poly.getNearestPoint(end);
    const dist = Math.hypot(end[0] - nearest[0], end[1] - nearest[1]);
    expect(dist).toBeLessThan(2);
  });

  test('concave polygon center anchor still produces a finite edge endpoint', async () => {
    // Arrowhead-like concave polygon; its centroid may sit near a notch.
    const CONCAVE = [
      [0, 0],
      [1, 0.5],
      [0, 1],
      [0.3, 0.5],
    ];
    const rectId = service.crud.addElement('shape', {
      shapeType: ShapeType.Rect,
      xywh: '[400,400,100,100]',
    });
    const polyId = addPolygon(CONCAVE);
    if (!rectId) throw new Error('Failed to create rect');

    const centroid = polygonCentroid(CONCAVE);
    const connId = service.crud.addElement('connector', {
      mode: ConnectorMode.Straight,
      source: { id: rectId, position: [0.5, 0.5] },
      target: { id: polyId, position: [centroid[0], centroid[1]] },
    });
    if (!connId) throw new Error('Failed to create connector');
    await wait(200);

    const connector = service.crud.getElementById(
      connId
    ) as ConnectorElementModel;
    expect(connector.path.length).toBeGreaterThan(0);

    const connBound = Bound.deserialize(connector.xywh);
    const last = connector.path[connector.path.length - 1];
    const endX = last[0] + connBound.x;
    const endY = last[1] + connBound.y;
    expect(Number.isFinite(endX) && Number.isFinite(endY)).toBe(true);
  });
});

describe('DOM rendering of center-anchored connectors', () => {
  beforeEach(async () => {
    localStorage.removeItem('blocksuite:connector:centerAnchor');
    const cleanup = await setupEditor('edgeless', [], {
      enableDomRenderer: true,
    });
    return cleanup;
  });

  test('renders SVG for center-anchored connector', async () => {
    const surfaceView = getSurface(window.doc, window.editor);
    const surfaceModel = surfaceView.model;

    const shape1Id = surfaceModel.addElement({
      type: 'shape',
      xywh: '[100,100,80,60]',
      shapeType: ShapeType.Rect,
    });

    const shape2Id = surfaceModel.addElement({
      type: 'shape',
      xywh: '[400,300,80,60]',
      shapeType: ShapeType.Rect,
    });

    const connectorId = surfaceModel.addElement({
      type: 'connector',
      source: { id: shape1Id, position: [0.5, 0.5] },
      target: { id: shape2Id, position: [0.5, 0.5] },
    });

    await wait(200);

    const connectorElement = surfaceView?.renderRoot.querySelector(
      `[data-element-id="${connectorId}"]`
    );
    expect(connectorElement).not.toBeNull();

    const svgElement = connectorElement?.querySelector('svg');
    expect(svgElement).not.toBeNull();
  });
});
