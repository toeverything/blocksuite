import { describe, expect, it } from 'vitest';

import { ShapeElement } from './shape-element.js';

const dataWithoutXywh = {
  id: '1',
  index: 'a0',
  type: 'shape',

  shapeType: 'rect',

  radius: 0.1,
  filled: false,
  fillColor: '#000000',
  strokeWidth: 4,
  strokeColor: '#000000',
  strokeStyle: 'solid',
};

const data = { ...dataWithoutXywh, xywh: '[0,0,20,20]' };

describe('brush element', () => {
  it('deserialize', () => {
    const element = ShapeElement.deserialize(data);
    expect(element).toMatchObject({
      ...dataWithoutXywh,
      x: 0,
      y: 0,
      w: 20,
      h: 20,
    });
  });

  it('serialize', () => {
    const element = ShapeElement.deserialize(data);
    const serialized = element.serialize();
    expect(serialized).toMatchObject(data);
  });

  it('hit test rect', () => {
    const element = ShapeElement.deserialize(data);
    expect(element.hitTest(0, 0)).toBeTruthy();
    // point is in rect, but not in path
    expect(element.hitTest(10, 10)).toBeTruthy();
    expect(element.hitTest(21, 21)).toBeFalsy();
  });

  it('hit test diamond', () => {
    const element = ShapeElement.deserialize({
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
    const element = ShapeElement.deserialize({
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
    const element = ShapeElement.deserialize({
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
    const element = ShapeElement.deserialize(data);
    const changed = ShapeElement.transform(element, {
      x: 1,
      y: 1,
      w: 10,
      h: 10,
    });
    expect(changed.xywh).toBe('[1,1,10,10]');
  });
});
