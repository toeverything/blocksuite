import type {
  GroupElementModel,
  ShapeElementModel,
  SurfaceBlockModel,
} from '@blocksuite/blocks';
import { beforeEach, describe, expect, test } from 'vitest';

import { wait } from '../utils/common.js';
import { setupEditor } from '../utils/setup.js';

let model: SurfaceBlockModel;

beforeEach(async () => {
  const cleanup = await setupEditor('edgeless');
  const models = page.getBlockByFlavour(
    'affine:surface'
  ) as SurfaceBlockModel[];

  model = models[0];

  return cleanup;
});

describe('elements management', () => {
  test('addElement should work correctly', () => {
    model.addElement({
      type: 'shape',
    });

    expect(model.elementModels.length).toBe(1);
  });

  test('removeElement should work correctly', () => {
    const id = model.addElement({
      type: 'shape',
    });

    model.removeElement(id);

    expect(model.elementModels.length).toBe(0);
  });

  test('updateElement should work correctly', () => {
    const id = model.addElement({
      type: 'shape',
    });

    model.updateElement(id, { xywh: '[10,10,200,200]' });

    expect(model.elementModels[0].xywh).toBe('[10,10,200,200]');
  });

  test('getElementById should return element', () => {
    const id = model.addElement({
      type: 'shape',
    });

    expect(model.getElementById(id)).not.toBeNull();
  });

  test('getElementById should return null if not found', () => {
    expect(model.getElementById('not-found')).toBeNull();
  });
});

describe('element model', () => {
  test('default value should work correctly', () => {
    const id = model.addElement({
      type: 'shape',
    });

    const element = model.getElementById(id)! as ShapeElementModel;

    expect(element.index).toBe('a0');
    expect(element.strokeColor).toBe('--affine-palette-line-yellow');
    expect(element.strokeWidth).toBe(4);
  });

  test('defined prop should not be overwritten by default value', () => {
    const id = model.addElement({
      type: 'shape',
      strokeColor: '#fff',
    });

    const element = model.getElementById(id)! as ShapeElementModel;

    expect(element.strokeColor).toBe('#fff');
  });
});

describe('group', () => {
  test('should get group', () => {
    const id = model.addElement({
      type: 'shape',
    });
    const id2 = model.addElement({
      type: 'shape',
    });

    const groupId = model.addElement({
      type: 'group',
      children: {
        [id]: true,
        [id2]: true,
      },
    });
    const group = model.getElementById(groupId);

    expect(group).not.toBe(null);
    expect(model.getGroup(id)).toBe(group);
    expect(model.getGroup(id2)).toBe(group);
  });

  test('should return null if group children are updated', () => {
    const id = model.addElement({
      type: 'shape',
    });
    const id2 = model.addElement({
      type: 'shape',
    });

    const groupId = model.addElement({
      type: 'group',
      children: {
        [id]: true,
        [id2]: true,
      },
    });
    const group = model.getElementById(groupId) as GroupElementModel;

    model.page.transact(() => {
      group.children.delete(id);
      group.children.delete(id2);
    });

    expect(model.getGroup(id)).toBeNull();
    expect(model.getGroup(id2)).toBeNull();
  });

  test('should return null if group are deleted', () => {
    const id = model.addElement({
      type: 'shape',
    });
    const id2 = model.addElement({
      type: 'shape',
    });

    const groupId = model.addElement({
      type: 'group',
      children: {
        [id]: true,
        [id2]: true,
      },
    });

    model.removeElement(groupId);
    expect(model.getGroup(id)).toBeNull();
    expect(model.getGroup(id2)).toBeNull();
    // @ts-ignore
    expect(model._elementToGroup.get(id)).toBeUndefined();
    // @ts-ignore
    expect(model._elementToGroup.get(id2)).toBeUndefined();
  });
});

describe('connector', () => {
  test('should get connector', () => {
    const id = model.addElement({
      type: 'shape',
    });
    const id2 = model.addElement({
      type: 'shape',
    });
    const connectorId = model.addElement({
      type: 'connector',
      source: {
        id,
      },
      target: {
        id: id2,
      },
    });
    const connector = model.getElementById(connectorId);

    expect(model.getConnectors(id)).toEqual([connector]);
    expect(model.getConnectors(id2)).toEqual([connector]);
  });

  test('multiple connectors are supported', () => {
    const id = model.addElement({
      type: 'shape',
    });
    const id2 = model.addElement({
      type: 'shape',
    });
    const connectorId = model.addElement({
      type: 'connector',
      source: {
        id,
      },
      target: {
        id: id2,
      },
    });
    const connectorId2 = model.addElement({
      type: 'connector',
      source: {
        id,
      },
      target: {
        id: id2,
      },
    });
    const connector = model.getElementById(connectorId);
    const connector2 = model.getElementById(connectorId2);

    expect(model.getConnectors(id)).toEqual([connector, connector2]);
    expect(model.getConnectors(id2)).toEqual([connector, connector2]);
  });

  test('should return null if connector are updated', () => {
    const id = model.addElement({
      type: 'shape',
    });
    const id2 = model.addElement({
      type: 'shape',
    });
    const connectorId = model.addElement({
      type: 'connector',
      source: {
        id,
      },
      target: {
        id: id2,
      },
    });

    model.updateElement(connectorId, {
      source: {
        position: [0, 0],
      },
      target: {
        position: [0, 0],
      },
    });

    expect(model.getConnectors(id)).toEqual([]);
    expect(model.getConnectors(id2)).toEqual([]);
  });

  test('should return null if connector are deleted', async () => {
    const id = model.addElement({
      type: 'shape',
    });
    const id2 = model.addElement({
      type: 'shape',
    });
    const connectorId = model.addElement({
      type: 'connector',
      source: {
        id,
      },
      target: {
        id: id2,
      },
    });

    model.removeElement(connectorId);

    await wait();

    expect(model.getConnectors(id)).toEqual([]);
    expect(model.getConnectors(id2)).toEqual([]);
  });
});
