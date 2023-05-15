import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';

import { Bound } from '../../utils/bound.js';
import { BrushElement } from './brush-element.js';
import type { IBrush } from './types.js';

const data: IBrush = {
  id: '1',
  index: 'a1',
  type: 'brush',
  xywh: '[0,0,104,104]',
  seed: 0,

  points: Array(100)
    .fill(0)
    .map((_, index) => [index + 2, index + 2]),
  color: '#000000',
  lineWidth: 4,
};

describe('brush element', () => {
  const doc = new Y.Doc();
  const yMap = doc.getMap('brush');

  it('deserialize', () => {
    const element = new BrushElement(yMap, data);
    expect(element.id).equal(data.id);
    expect(element.color).equal(data.color);
    expect(element.lineWidth).equal(data.lineWidth);
    expect(element.x).equal(0);
    expect(element.y).equal(0);
    expect(element.w).equal(104);
    expect(element.h).equal(104);
  });

  it('serialize', () => {
    const element = new BrushElement(yMap, data);
    const serialized = element.serialize();
    expect(serialized).toMatchObject(data);
  });

  it('hit test', () => {
    const element = new BrushElement(yMap, data);
    expect(element.hitTest(8.5, 8.5)).toBeTruthy();
    // point is in rect, but not in path
    expect(element.hitTest(20, 60)).toBeTruthy();
  });

  it('transform', () => {
    const element = new BrushElement(yMap, data);
    element.applyUpdate({
      xywh: new Bound(0, 0, 204, 204).serialize(),
    });
    expect(element.xywh).toBe('[0,0,204,204]');
    const points = (element.points || []).map(([x, y]: number[]) => [
      Math.round(x * 100) / 100,
      Math.round(y * 100) / 100,
    ]);
    expect(points).toMatchObject(
      data.points.map(([x, y]: number[]) => [(x - 2) * 2 + 2, (y - 2) * 2 + 2])
    );
  });
});
