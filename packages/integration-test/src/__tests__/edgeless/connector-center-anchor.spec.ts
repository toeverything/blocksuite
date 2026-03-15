import type { EdgelessRootBlockComponent } from '@blocksuite/affine/blocks/root';
import {
  type ConnectorElementModel,
  ConnectorMode,
  type ShapeElementModel,
  ShapeType,
} from '@blocksuite/affine/model';
import { EditPropsStore } from '@blocksuite/affine/shared/services';
import {
  getAnchors,
  isCenterAnchorEligible,
  isCenterAnchorEnabled,
} from '@blocksuite/affine-gfx-connector';
import { Bound } from '@blocksuite/global/gfx';
import type { BlockStdScope } from '@blocksuite/std';
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
