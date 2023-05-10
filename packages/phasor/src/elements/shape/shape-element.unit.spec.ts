import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';

import { StrokeStyle } from '../../consts.js';
import { Bound } from '../../utils/bound.js';
import { ShapeElement } from './shape-element.js';
import type { IShape } from './types.js';

const dataWithoutXywh: Omit<IShape, 'xywh'> = {
  id: '1',
  index: 'a0',
  type: 'shape',

  shapeType: 'rect',

  radius: 0.1,
  filled: false,
  fillColor: '#000000',
  strokeWidth: 4,
  strokeColor: '#000000',
  strokeStyle: StrokeStyle.Solid,
};

const data: IShape = { ...dataWithoutXywh, xywh: '[0,0,20,20]' };

describe('brush element', () => {
  const doc = new Y.Doc();
  const yMap = doc.getMap('brush');

  it('deserialize', () => {
    const element = new ShapeElement(yMap, data);
    expect(element).toMatchObject({
      ...dataWithoutXywh,
      x: 0,
      y: 0,
      w: 20,
      h: 20,
    });
  });

  it('serialize', () => {
    const element = new ShapeElement(yMap, data);
    const serialized = element.serialize();
    expect(serialized).toMatchObject(data);
  });

  it('hit test rect', () => {
    const element = new ShapeElement(yMap, data);
    expect(element.hitTest(0, 0)).toBeTruthy();
    // point is in rect, but not in path
    expect(element.hitTest(10, 10)).toBeTruthy();
    expect(element.hitTest(21, 21)).toBeFalsy();
  });

  it('hit test diamond', () => {
    const element = new ShapeElement(yMap, {
      ...data,
      shapeType: 'diamond',
    });
    expect(element.hitTest(0, 0)).toBeFalsy();
    // point is in corner
    expect(element.hitTest(10, 1)).toBeTruthy();
    // point is in path
    expect(element.hitTest(5, 5)).toBeTruthy();
    expect(element.hitTest(21, 21)).toBeFalsy();
  });

  it('hit test triangle', () => {
    const element = new ShapeElement(yMap, {
      ...data,
      shapeType: 'triangle',
    });
    expect(element.hitTest(0, 0)).toBeFalsy();
    // point is in corner
    expect(element.hitTest(10, 1)).toBeTruthy();
    // point is in path
    expect(element.hitTest(1, 18)).toBeTruthy();
    expect(element.hitTest(21, 21)).toBeFalsy();
  });

  it('hit test ellipse', () => {
    const element = new ShapeElement(yMap, {
      ...data,
      shapeType: 'ellipse',
    });
    expect(element.hitTest(0, 0)).toBeFalsy();
    // point is in corner
    expect(element.hitTest(10, 1)).toBeTruthy();
    // point is in path
    expect(
      element.hitTest(10 - 10 / Math.sqrt(2), 10 - 10 / Math.sqrt(2))
    ).toBeTruthy();
    expect(element.hitTest(21, 21)).toBeFalsy();
  });

  it('transform', () => {
    const element = new ShapeElement(yMap, data);
    element.applyUpdate({
      xywh: new Bound(1, 1, 10, 10).serialize(),
    });
    expect(element.xywh).toBe('[1,1,10,10]');
  });
});
