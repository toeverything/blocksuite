import type { VRange } from '../types.js';

export function isVRangeContain(a: VRange, b: VRange): boolean {
  return a.index <= b.index && a.index + a.length >= b.index + b.length;
}

export function isVRangeEqual(a: VRange, b: VRange): boolean {
  return a.index === b.index && a.length === b.length;
}

export function isVRangeIntersect(a: VRange, b: VRange): boolean {
  return a.index <= b.index + b.length && a.index + a.length >= b.index;
}

export function isVRangeBefore(a: VRange, b: VRange): boolean {
  return a.index + a.length <= b.index;
}

export function isVRangeAfter(a: VRange, b: VRange): boolean {
  return a.index >= b.index + b.length;
}

export function isVRangeEdge(index: VRange['index'], range: VRange): boolean {
  return index === range.index || index === range.index + range.length;
}

export function isVRangeEdgeBefore(
  index: VRange['index'],
  range: VRange
): boolean {
  return index === range.index;
}

export function isVRangeEdgeAfter(
  index: VRange['index'],
  range: VRange
): boolean {
  return index === range.index + range.length;
}

export function isPoint(range: VRange): boolean {
  return range.length === 0;
}

export function mergeVRange(a: VRange, b: VRange): VRange {
  const index = Math.min(a.index, b.index);
  const length = Math.max(a.index + a.length, b.index + b.length) - index;
  return { index, length };
}

export function intersectVRange(a: VRange, b: VRange): VRange | null {
  if (!isVRangeIntersect(a, b)) {
    return null;
  }
  const index = Math.max(a.index, b.index);
  const length = Math.min(a.index + a.length, b.index + b.length) - index;
  return { index, length };
}
