// Reorders the shapes or frames.

export type ReorderingType = 'front' | 'forward' | 'backward' | 'back';

export interface ReorderingAction<T> {
  type: ReorderingType;
  elements: T[];
}

export interface ReorderingRange {
  start: number;
  end: number;
}

/**
 * Gets indexes of a from b.
 */
export function getIndexes<T>(a: T[], b: T[]): number[] {
  return a.map(e => b.findIndex(element => element === e));
}

/**
 * Generates the ranges via indexes;
 */
export function generateRanges(indexes: number[]): ReorderingRange[] {
  let curr;
  let i = 1;
  let start = indexes[0];
  let end = indexes[0];
  const ranges = [{ start, end }];
  const len = indexes.length;
  for (; i < len; i++) {
    curr = indexes[i];
    if (curr - end === 1) {
      ranges[ranges.length - 1].end = end = curr;
    } else {
      start = end = curr;
      ranges.push({ start, end });
    }
  }
  return ranges;
}

/**
 * Generates bounds with selected elements.
 */
export function generateBounds<T>(
  elements: T[],
  getXYWH: (e: T) => {
    x: number;
    y: number;
    h: number;
    w: number;
  }
): {
  x: number;
  y: number;
  h: number;
  w: number;
} {
  const bounds = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  };

  const len = elements.length;

  if (len) {
    let i = 0;
    const { x, y, w, h } = getXYWH(elements[i]);
    let minX = x;
    let minY = y;
    let maxX = x + w;
    let maxY = y + h;

    for (i++; i < len; i++) {
      const { x, y, w, h } = getXYWH(elements[i]);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    }

    bounds.x = minX;
    bounds.y = minY;
    bounds.w = maxX - minX;
    bounds.h = maxY - minY;
  }

  return bounds;
}

/**
 * Reorders the elements, moving multiple ranges of child elements to the end.
 */
export function bringToFront<T>(ranges: ReorderingRange[], elements: T[]) {
  let n = 0;
  let i = ranges.length;
  const t = elements.length;
  while (i) {
    i--;
    const { start, end } = ranges[i];
    const temp = elements.splice(start, end + 1 - start);
    n += temp.length;
    elements.splice(t - n, 0, ...temp);
  }
}

/**
 * Reorders the elements, moving multiple ranges of child elements forward.
 */
export function bringForward<T>(ranges: ReorderingRange[], elements: T[]) {
  let i = ranges.length;
  while (i) {
    i--;
    const { start, end } = ranges[i];
    const temp = elements.splice(start, end + 1 - start);
    elements.splice(start + 1, 0, ...temp);
  }
}

/**
 * Reorders the elements, moving multiple ranges of child elements backward.
 */
export function sendBackward<T>(ranges: ReorderingRange[], elements: T[]) {
  let i = 0;
  const len = ranges.length;
  for (; i < len; i++) {
    const { start, end } = ranges[i];
    if (start === 0) continue;
    const temp = elements.splice(start, end + 1 - start);
    elements.splice(start - 1, 0, ...temp);
  }
}

/**
 * Reorders the elements, moving multiple ranges of child elements to the start.
 */
export function sendToBack<T>(ranges: ReorderingRange[], elements: T[]) {
  let i = 0;
  let n = 0;
  const len = ranges.length;
  for (; i < len; i++) {
    const { start, end } = ranges[i];
    const temp = elements.splice(start, end + 1 - start);
    elements.splice(n, 0, ...temp);
    n += temp.length;
  }
}
