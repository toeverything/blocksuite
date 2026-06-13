import {
  type BpmnNodeElementModel,
  type BpmnPoolElementModel,
  type ConnectorElementModel,
  ConnectorMode,
  ShapeElementModel,
} from '@labre/affine/model';
import { beforeEach, describe, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { getSurface } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

describe('BPMN framework elements', () => {
  beforeEach(async () => {
    const cleanup = await setupEditor('edgeless');
    return cleanup;
  });

  test('each flow-object node is a native shape with its kind', () => {
    const surface = getSurface(window.doc, window.editor).model;

    const cases = [
      { kind: 'startEvent', shapeType: 'ellipse' },
      { kind: 'endEvent', shapeType: 'ellipse' },
      { kind: 'task', shapeType: 'rect' },
      { kind: 'gatewayExclusive', shapeType: 'diamond' },
    ] as const;

    for (const { kind, shapeType } of cases) {
      const id = surface.addElement({
        type: 'bpmnNode',
        kind,
        shapeType,
        xywh: '[0,0,80,80]',
      });
      const model = surface.getElementById(id) as BpmnNodeElementModel;
      expect(model.type).toBe('bpmnNode');
      expect(model.kind).toBe(kind);
      expect(model.shapeType).toBe(shapeType);
      // Inherits native shape behaviour + restricts connector anchors to centre.
      expect(model instanceof ShapeElementModel).toBe(true);
      expect(model.centerAnchorOnly).toBe(true);
    }
  });

  test('pool is a non-connectable background with an editable name', () => {
    const surface = getSurface(window.doc, window.editor).model;

    const id = surface.addElement({ type: 'bpmnPool', xywh: '[0,0,560,200]' });
    const pool = surface.getElementById(id) as BpmnPoolElementModel;
    expect(pool.type).toBe('bpmnPool');
    expect(pool.name).toBe('Pool');
    expect(pool.resizeEnabled).toBe(true);
    expect(pool.connectable).toBe(false);
  });

  test('a sequence flow connects two nodes', async () => {
    const surface = getSurface(window.doc, window.editor).model;

    const startId = surface.addElement({
      type: 'bpmnNode',
      kind: 'startEvent',
      shapeType: 'ellipse',
      xywh: '[0,0,56,56]',
    });
    const taskId = surface.addElement({
      type: 'bpmnNode',
      kind: 'task',
      shapeType: 'rect',
      xywh: '[300,0,120,72]',
    });

    const connId = surface.addElement({
      type: 'connector',
      mode: ConnectorMode.Orthogonal,
      source: { id: startId, position: [0.5, 0.5] },
      target: { id: taskId, position: [0.5, 0.5] },
    });

    await wait(200);

    const connector = surface.getElementById(connId) as ConnectorElementModel;
    expect(connector.path.length).toBeGreaterThan(0);
    expect(connector.source.id).toBe(startId);
    expect(connector.target.id).toBe(taskId);
  });
});
