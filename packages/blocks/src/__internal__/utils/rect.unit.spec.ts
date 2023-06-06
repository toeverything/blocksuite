import { describe, expect, it } from 'vitest';

import { Point } from './rect.js';

describe('Point', () => {
  it('static from should return a point', () => {
    expect(Point.from([0, 0])).toEqual(new Point(0, 0));
    expect(Point.from(0, 0)).toEqual(new Point(0, 0));
    expect(Point.from({ x: 0, y: 0 })).toEqual(new Point(0, 0));
  });

  it('should return a min point', () => {
    const a = new Point(0, 0);
    const b = new Point(-1, 1);
    expect(Point.min(a, b)).toEqual(new Point(-1, 0));
  });

  it('should return a max point', () => {
    const a = new Point(0, 0);
    const b = new Point(-1, 1);
    expect(Point.max(a, b)).toEqual(new Point(0, 1));
  });

  it('should return a clamp point', () => {
    const min = new Point(0, 0);
    const max = new Point(1, 1);
    const a = new Point(-1, 2);
    expect(Point.clamp(a, min, max)).toEqual(new Point(0, 1));

    const b = new Point(2, 2);
    expect(Point.clamp(b, min, max)).toEqual(new Point(1, 1));

    const c = new Point(0.5, 0.5);
    expect(Point.clamp(c, min, max)).toEqual(new Point(0.5, 0.5));
  });

  it('should return a copy of point', () => {
    const a = new Point(0, 0);
    expect(a.clone()).toEqual(new Point(0, 0));
  });

  it('#set method should set x and y', () => {
    const p = new Point(0, 0);
    p.set(1, 2);
    expect(p).toEqual(new Point(1, 2));
  });

  it('#add', () => {
    const a = new Point(1, 2);
    const b = new Point(3, 4);
    expect(a.add(b)).toEqual(new Point(4, 6));
  });

  it('#subtract', () => {
    const a = new Point(1, 2);
    const b = new Point(3, 4);
    expect(a.subtract(b)).toEqual(new Point(-2, -2));
  });

  it('#scale', () => {
    const a = new Point(1, 2);
    expect(a.scale(2)).toEqual(new Point(2, 4));
  });

  it('#cross', () => {
    const a = new Point(1, 2);
    const b = new Point(3, 4);
    expect(a.cross(b)).toBe(-2);
  });

  it('#lerp', () => {
    const a = new Point(1, 2);
    const b = new Point(3, 4);
    expect(a.lerp(b, 0.5)).toEqual(new Point(2, 3));
  });

  it('#toArray', () => {
    const a = new Point(1, 2);
    expect(a.toArray()).toEqual([1, 2]);
  });
});
