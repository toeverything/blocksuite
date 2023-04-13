import { describe, expect, it } from 'vitest';

import { BrushElement } from './brush-element.js';

const data = {
  id: '1',
  color: '#000000',
  lineWidth: 4,
  xywh: '[0,0,104,104]',
  points: JSON.stringify(
    Array(100)
      .fill(0)
      .map((_, index) => [index, index])
  ),
};

describe('brush element', () => {
  it('deserialize', () => {
    const element = BrushElement.deserialize(data);
    expect(element.id).equal(data.id);
    expect(element.color).equal(data.color);
    expect(element.lineWidth).equal(data.lineWidth);
    expect(element.x).equal(0);
    expect(element.y).equal(0);
    expect(element.w).equal(104);
    expect(element.h).equal(104);
  });

  it('serialize', () => {
    const element = BrushElement.deserialize(data);
    const serialized = element.serialize();
    expect(serialized).toMatchObject(data);
  });

  it('hit test', () => {
    const element = BrushElement.deserialize(data);
    expect(element.hitTest(8.5, 8.5)).toBeTruthy();
    // point is in rect, but not in path
    expect(element.hitTest(20, 60)).toBeTruthy();
  });

  it('transform', () => {
    const element = BrushElement.deserialize(data);
    const props = BrushElement.getBoundProps(element, {
      x: 0,
      y: 0,
      w: 204,
      h: 204,
    });
    expect(props.xywh).toBe('[0,0,204,204]');
    const points = JSON.parse(props.points).map(([x, y]: [number, number]) => [
      Math.round(x * 100) / 100,
      Math.round(y * 100) / 100,
    ]);
    expect(points).toMatchObject(
      JSON.parse(data.points).map(([x, y]: [number, number]) => [x * 2, y * 2])
    );
  });
});
