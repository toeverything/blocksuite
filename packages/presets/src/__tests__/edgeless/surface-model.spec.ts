import type {
  BrushElementModel,
  GroupElementModel,
  ShapeElementModel,
  SurfaceBlockModel,
} from '@blocksuite/blocks';

import { beforeEach, describe, expect, test, vi } from 'vitest';

import { wait } from '../utils/common.js';
import { setupEditor } from '../utils/setup.js';

let model: SurfaceBlockModel;

beforeEach(async () => {
  const cleanup = await setupEditor('edgeless');
  const models = doc.getBlockByFlavour('affine:surface') as SurfaceBlockModel[];

  model = models[0];

  return cleanup;
});

describe('elements management', () => {
  test('addElement should work correctly', () => {
    const id = model.addElement({
      type: 'shape',
    });

    expect(model.elementModels[0].id).toBe(id);
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
      strokeColor: '--affine-palette-line-black',
    });

    const element = model.getElementById(id)! as ShapeElementModel;

    expect(element.strokeColor).toBe('--affine-palette-line-black');
  });

  test('assign value to model property should update ymap directly', () => {
    const id = model.addElement({
      type: 'shape',
    });

    const element = model.getElementById(id)! as ShapeElementModel;

    expect(element.yMap.get('strokeColor')).toBe(
      '--affine-palette-line-yellow'
    );

    element.strokeColor = '--affine-palette-line-black';
    expect(element.yMap.get('strokeColor')).toBe('--affine-palette-line-black');
    expect(element.strokeColor).toBe('--affine-palette-line-black');
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
    const shape = model.getElementById(id)!;
    const shape2 = model.getElementById(id2)!;

    expect(group).not.toBe(null);
    expect(model.getGroup(id)).toBe(group);
    expect(model.getGroup(id2)).toBe(group);
    expect(shape.group).toBe(group);
    expect(shape2.group).toBe(group);
  });

  test('should return null if children property is updated', () => {
    const id = model.addElement({
      type: 'shape',
    });
    const id2 = model.addElement({
      type: 'shape',
    });
    const id3 = model.addElement({
      type: 'shape',
    });

    const groupId = model.addElement({
      type: 'group',
      children: {
        [id]: true,
        [id2]: true,
        [id3]: true,
      },
    });
    const group = model.getElementById(groupId) as GroupElementModel;

    model.doc.transact(() => {
      group.children.delete(id);
      group.children.delete(id2);
    });

    expect(model.getElementById(groupId)).toBe(group);
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

  test('children can be updated with a plain object', () => {
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

    model.updateElement(groupId, {
      children: {
        [id]: false,
      },
    });

    expect(group.childIds).toEqual([id]);
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
    const connector = model.getElementById(connectorId)!;

    expect(model.getConnectors(id).map(el => el.id)).toEqual([connector.id]);
    expect(model.getConnectors(id2).map(el => el.id)).toEqual([connector.id]);
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

    const connector = model.getElementById(connectorId)!;
    const connector2 = model.getElementById(connectorId2)!;
    const connectors = [connector.id, connector2.id];

    expect(model.getConnectors(id).map(c => c.id)).toEqual(connectors);
    expect(model.getConnectors(id2).map(c => c.id)).toEqual(connectors);
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

describe('stash/pop', () => {
  test('stash and pop should work correctly', () => {
    const id = model.addElement({
      type: 'shape',
      strokeWidth: 4,
    });
    const elementModel = model.getElementById(id)! as ShapeElementModel;

    expect(elementModel.strokeWidth).toBe(4);

    elementModel.stash('strokeWidth');
    elementModel.strokeWidth = 10;
    expect(elementModel.strokeWidth).toBe(10);
    expect(elementModel.yMap.get('strokeWidth')).toBe(4);

    elementModel.pop('strokeWidth');
    expect(elementModel.strokeWidth).toBe(10);
    expect(elementModel.yMap.get('strokeWidth')).toBe(10);

    elementModel.strokeWidth = 6;
    expect(elementModel.strokeWidth).toBe(6);
    expect(elementModel.yMap.get('strokeWidth')).toBe(6);
  });

  test('assign stashed property should emit event', () => {
    const id = model.addElement({
      type: 'shape',
      strokeWidth: 4,
    });
    const elementModel = model.getElementById(id)! as ShapeElementModel;

    elementModel.stash('strokeWidth');

    const onchange = vi.fn();
    model.elementUpdated.once(({ id }) => onchange(id));

    elementModel.strokeWidth = 10;
    expect(onchange).toHaveBeenCalledWith(id);
  });

  test('stashed property should also trigger derive decorator', () => {
    const id = model.addElement({
      type: 'brush',
      points: [
        [0, 0],
        [100, 100],
        [120, 150],
      ],
    });
    const elementModel = model.getElementById(id)! as BrushElementModel;

    elementModel.stash('points');
    elementModel.points = [
      [0, 0],
      [50, 50],
      [135, 145],
      [150, 170],
      [200, 180],
    ];
    const points = elementModel.points;

    expect(elementModel.w).toBe(200 + elementModel.lineWidth);
    expect(elementModel.h).toBe(180 + elementModel.lineWidth);

    expect(elementModel.yMap.get('points')).not.toEqual(points);
    expect(elementModel.w).toBe(200 + elementModel.lineWidth);
    expect(elementModel.h).toBe(180 + elementModel.lineWidth);
  });

  test('non-field property should not allow stash/pop, and should failed silently ', () => {
    const id = model.addElement({
      type: 'group',
    });
    const elementModel = model.getElementById(id)! as GroupElementModel;

    elementModel.stash('xywh');
    elementModel.xywh = '[10,10,200,200]';

    expect(elementModel['_stashed'].has('xywh')).toBe(false);

    elementModel.pop('xywh');

    expect(elementModel['_stashed'].has('xywh')).toBe(false);
    expect(elementModel.yMap.has('xywh')).toBe(false);
  });
});

describe('derive decorator', () => {
  test('derived decorator should work correctly', () => {
    const id = model.addElement({
      type: 'brush',
      points: [
        [0, 0],
        [100, 100],
        [120, 150],
      ],
    });
    const elementModel = model.getElementById(id)! as BrushElementModel;

    expect(elementModel.w).toBe(120 + elementModel.lineWidth);
    expect(elementModel.h).toBe(150 + elementModel.lineWidth);
  });
});

describe('local decorator', () => {
  test('local decorator should work correctly', () => {
    const id = model.addElement({
      type: 'shape',
    });
    const elementModel = model.getElementById(id)! as BrushElementModel;

    expect(elementModel.display).toBe(true);

    elementModel.display = false;
    expect(elementModel.display).toBe(false);

    elementModel.opacity = 0.5;
    expect(elementModel.opacity).toBe(0.5);
  });

  test('assign local property should emit event', () => {
    const id = model.addElement({
      type: 'shape',
    });
    const elementModel = model.getElementById(id)! as BrushElementModel;

    const onchange = vi.fn();

    model.elementUpdated.once(({ id }) => onchange(id));
    elementModel.display = false;

    expect(elementModel.display).toBe(false);
    expect(onchange).toHaveBeenCalledWith(id);
  });
});

describe('convert decorator', () => {
  test('convert decorator', () => {
    const id = model.addElement({
      type: 'brush',
      points: [
        [50, 25],
        [200, 200],
        [300, 300],
      ],
    });
    const elementModel = model.getElementById(id)! as BrushElementModel;
    const halfLineWidth = elementModel.lineWidth / 2;
    const xOffset = 50 - halfLineWidth;
    const yOffset = 25 - halfLineWidth;

    expect(elementModel.points).toEqual([
      [50 - xOffset, 25 - yOffset],
      [200 - xOffset, 200 - yOffset],
      [300 - xOffset, 300 - yOffset],
    ]);
  });
});

describe('basic property', () => {
  test('empty group should have all zero xywh', () => {
    const id = model.addElement({
      type: 'group',
    });
    const group = model.getElementById(id)! as GroupElementModel;

    expect(group.x).toBe(0);
    expect(group.y).toBe(0);
    expect(group.w).toBe(0);
    expect(group.h).toBe(0);
  });
});

describe('brush', () => {
  test('same lineWidth should have same xywh', () => {
    const id = model.addElement({
      type: 'brush',
      lineWidth: 2,
      points: [
        [0, 0],
        [100, 100],
        [120, 150],
      ],
    });
    const brush = model.getElementById(id) as BrushElementModel;
    const oldBrushXYWH = brush.xywh;

    brush.lineWidth = 4;

    expect(brush.xywh).not.toBe(oldBrushXYWH);

    brush.lineWidth = 2;

    expect(brush.xywh).toBe(oldBrushXYWH);
  });
});
