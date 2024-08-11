import { getBoundsFromPoints, getBoundsWithRotation } from './math.js';
import { Bound, type IBound, type IVec } from './model/index.js';

function getExpandedBound(a: IBound, b: IBound): IBound {
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.w, b.x + b.w);
  const maxY = Math.max(a.y + a.h, b.y + b.h);
  const width = Math.abs(maxX - minX);
  const height = Math.abs(maxY - minY);

  return {
    x: minX,
    y: minY,
    w: width,
    h: height,
  };
}

export function getCommonBound(bounds: IBound[]): Bound | null {
  if (!bounds.length) {
    return null;
  }
  if (bounds.length === 1) {
    const { x, y, w, h } = bounds[0];
    return new Bound(x, y, w, h);
  }

  let result = bounds[0];

  for (let i = 1; i < bounds.length; i++) {
    result = getExpandedBound(result, bounds[i]);
  }

  return new Bound(result.x, result.y, result.w, result.h);
}

export function getElementsBound(bounds: IBound[]): Bound {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  bounds.forEach(ele => {
    const b = getBoundsWithRotation(ele);

    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  });

  return new Bound(minX, minY, maxX - minX, maxY - minY);
}

export function getBoundFromPoints(points: IVec[]) {
  const { minX, minY, width, height } = getBoundsFromPoints(points);
  return new Bound(minX, minY, width, height);
}

export function inflateBound(bound: IBound, delta: number) {
  const half = delta / 2;

  const newBound = new Bound(
    bound.x - half,
    bound.y - half,
    bound.w + delta,
    bound.h + delta
  );

  if (newBound.w <= 0 || newBound.h <= 0) {
    throw new Error('Invalid delta range or bound size.');
  }

  return newBound;
}

export function transformPointsToNewBound<T extends { x: number; y: number }>(
  points: T[],
  oldBound: IBound,
  oldMargin: number,
  newBound: IBound,
  newMargin: number
) {
  const wholeOldMargin = oldMargin * 2;
  const wholeNewMargin = newMargin * 2;
  const oldW = Math.max(oldBound.w - wholeOldMargin, 1);
  const oldH = Math.max(oldBound.h - wholeOldMargin, 1);
  const newW = Math.max(newBound.w - wholeNewMargin, 1);
  const newH = Math.max(newBound.h - wholeNewMargin, 1);

  const transformedPoints = points.map(p => {
    return {
      ...p,
      x: newW * ((p.x - oldMargin) / oldW) + newMargin,
      y: newH * ((p.y - oldMargin) / oldH) + newMargin,
    } as T;
  });

  return {
    points: transformedPoints,
    bound: new Bound(
      newBound.x,
      newBound.y,
      newW + wholeNewMargin,
      newH + wholeNewMargin
    ),
  };
}
