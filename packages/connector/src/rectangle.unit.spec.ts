import { describe, expect, it } from 'vitest';

import { Rectangle } from './rectangle.js';

describe('rectangle', () => {
  it('inflate', () => {
    const rect1 = new Rectangle(0, 0, 1, 1);
    const inflated = rect1.inflate(10, 10);
    expect(inflated).toMatchObject({
      x: -10,
      y: -10,
      w: 21,
      h: 21,
    });
  });

  it('contains(point on edge)', () => {
    const rect = new Rectangle(0, 0, 10, 10);
    expect(rect.contains(10, 10)).toBeTruthy();
  });

  it('relativeDirection', () => {
    const rect = new Rectangle(0, 0, 100, 100);
    const directionLeft = rect.relativeDirection(10, 30);
    expect(directionLeft).toBe('left');

    const directionTop = rect.relativeDirection(30, 10);
    expect(directionTop).toBe('top');

    const directionRight = rect.relativeDirection(90, 30);
    expect(directionRight).toBe('right');

    const directionBottom = rect.relativeDirection(30, 90);
    expect(directionBottom).toBe('bottom');
  });
});
