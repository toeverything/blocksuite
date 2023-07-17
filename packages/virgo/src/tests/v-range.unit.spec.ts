import { expect, test } from 'vitest';

import {
  intersectVRange,
  isPoint,
  isVRangeAfter,
  isVRangeBefore,
  isVRangeContain,
  isVRangeEdge,
  isVRangeEdgeAfter,
  isVRangeEdgeBefore,
  isVRangeEqual,
  isVRangeIntersect,
  mergeVRange,
} from '../utils/v-range.js';

test('isVRangeContain', () => {
  expect(
    isVRangeContain({ index: 0, length: 0 }, { index: 0, length: 0 })
  ).toEqual(true);

  expect(
    isVRangeContain({ index: 0, length: 0 }, { index: 0, length: 2 })
  ).toEqual(false);

  expect(
    isVRangeContain({ index: 0, length: 2 }, { index: 0, length: 0 })
  ).toEqual(true);

  expect(
    isVRangeContain({ index: 0, length: 2 }, { index: 0, length: 1 })
  ).toEqual(true);

  expect(
    isVRangeContain({ index: 0, length: 2 }, { index: 0, length: 2 })
  ).toEqual(true);

  expect(
    isVRangeContain({ index: 1, length: 3 }, { index: 0, length: 0 })
  ).toEqual(false);

  expect(
    isVRangeContain({ index: 1, length: 3 }, { index: 0, length: 1 })
  ).toEqual(false);

  expect(
    isVRangeContain({ index: 1, length: 3 }, { index: 0, length: 2 })
  ).toEqual(false);

  expect(
    isVRangeContain({ index: 1, length: 4 }, { index: 2, length: 0 })
  ).toEqual(true);

  expect(
    isVRangeContain({ index: 1, length: 4 }, { index: 2, length: 3 })
  ).toEqual(true);

  expect(
    isVRangeContain({ index: 1, length: 4 }, { index: 2, length: 4 })
  ).toEqual(false);
});

test('isVRangeEqual', () => {
  expect(
    isVRangeEqual({ index: 0, length: 0 }, { index: 0, length: 0 })
  ).toEqual(true);

  expect(
    isVRangeEqual({ index: 0, length: 2 }, { index: 0, length: 1 })
  ).toEqual(false);

  expect(
    isVRangeEqual({ index: 1, length: 3 }, { index: 1, length: 3 })
  ).toEqual(true);

  expect(
    isVRangeEqual({ index: 0, length: 0 }, { index: 1, length: 0 })
  ).toEqual(false);

  expect(
    isVRangeEqual({ index: 2, length: 0 }, { index: 2, length: 0 })
  ).toEqual(true);
});

test('isVRangeIntersect', () => {
  expect(
    isVRangeIntersect({ index: 0, length: 2 }, { index: 0, length: 0 })
  ).toEqual(true);

  expect(
    isVRangeIntersect({ index: 0, length: 2 }, { index: 2, length: 0 })
  ).toEqual(true);

  expect(
    isVRangeIntersect({ index: 0, length: 0 }, { index: 1, length: 0 })
  ).toEqual(false);

  expect(
    isVRangeIntersect({ index: 1, length: 0 }, { index: 1, length: 0 })
  ).toEqual(true);

  expect(
    isVRangeIntersect({ index: 1, length: 0 }, { index: 0, length: 1 })
  ).toEqual(true);

  expect(
    isVRangeIntersect({ index: 1, length: 0 }, { index: 0, length: 0 })
  ).toEqual(false);

  expect(
    isVRangeIntersect({ index: 1, length: 0 }, { index: 2, length: 0 })
  ).toEqual(false);

  expect(
    isVRangeIntersect({ index: 1, length: 0 }, { index: 0, length: 2 })
  ).toEqual(true);
});

test('isVRangeBefore', () => {
  expect(
    isVRangeBefore({ index: 0, length: 1 }, { index: 2, length: 0 })
  ).toEqual(true);

  expect(
    isVRangeBefore({ index: 2, length: 0 }, { index: 0, length: 1 })
  ).toEqual(false);

  expect(
    isVRangeBefore({ index: 0, length: 0 }, { index: 1, length: 0 })
  ).toEqual(true);

  expect(
    isVRangeBefore({ index: 1, length: 0 }, { index: 0, length: 0 })
  ).toEqual(false);

  expect(
    isVRangeBefore({ index: 0, length: 0 }, { index: 0, length: 0 })
  ).toEqual(true);

  expect(
    isVRangeBefore({ index: 0, length: 0 }, { index: 0, length: 1 })
  ).toEqual(true);

  expect(
    isVRangeBefore({ index: 0, length: 1 }, { index: 0, length: 0 })
  ).toEqual(false);
});

test('isVRangeAfter', () => {
  expect(
    isVRangeAfter({ index: 2, length: 0 }, { index: 0, length: 1 })
  ).toEqual(true);

  expect(
    isVRangeAfter({ index: 0, length: 1 }, { index: 2, length: 0 })
  ).toEqual(false);

  expect(
    isVRangeAfter({ index: 1, length: 0 }, { index: 0, length: 0 })
  ).toEqual(true);

  expect(
    isVRangeAfter({ index: 0, length: 0 }, { index: 1, length: 0 })
  ).toEqual(false);

  expect(
    isVRangeAfter({ index: 0, length: 0 }, { index: 0, length: 0 })
  ).toEqual(true);

  expect(
    isVRangeAfter({ index: 0, length: 0 }, { index: 0, length: 1 })
  ).toEqual(false);

  expect(
    isVRangeAfter({ index: 0, length: 1 }, { index: 0, length: 0 })
  ).toEqual(true);
});

test('isVRangeEdge', () => {
  expect(isVRangeEdge(1, { index: 1, length: 0 })).toEqual(true);

  expect(isVRangeEdge(1, { index: 0, length: 1 })).toEqual(true);

  expect(isVRangeEdge(0, { index: 0, length: 0 })).toEqual(true);

  expect(isVRangeEdge(1, { index: 0, length: 0 })).toEqual(false);

  expect(isVRangeEdge(0, { index: 1, length: 0 })).toEqual(false);

  expect(isVRangeEdge(0, { index: 0, length: 1 })).toEqual(true);
});

test('isVRangeEdgeBefore', () => {
  expect(isVRangeEdgeBefore(1, { index: 1, length: 0 })).toEqual(true);

  expect(isVRangeEdgeBefore(1, { index: 0, length: 1 })).toEqual(false);

  expect(isVRangeEdgeBefore(0, { index: 0, length: 0 })).toEqual(true);

  expect(isVRangeEdgeBefore(1, { index: 0, length: 0 })).toEqual(false);

  expect(isVRangeEdgeBefore(0, { index: 1, length: 0 })).toEqual(false);

  expect(isVRangeEdgeBefore(0, { index: 0, length: 1 })).toEqual(true);
});

test('isVRangeEdgeAfter', () => {
  expect(isVRangeEdgeAfter(1, { index: 0, length: 1 })).toEqual(true);

  expect(isVRangeEdgeAfter(1, { index: 1, length: 0 })).toEqual(true);

  expect(isVRangeEdgeAfter(0, { index: 0, length: 0 })).toEqual(true);

  expect(isVRangeEdgeAfter(0, { index: 1, length: 0 })).toEqual(false);

  expect(isVRangeEdgeAfter(1, { index: 0, length: 0 })).toEqual(false);

  expect(isVRangeEdgeAfter(0, { index: 0, length: 1 })).toEqual(false);

  expect(isVRangeEdgeAfter(0, { index: 0, length: 0 })).toEqual(true);
});

test('isPoint', () => {
  expect(isPoint({ index: 1, length: 0 })).toEqual(true);

  expect(isPoint({ index: 0, length: 2 })).toEqual(false);

  expect(isPoint({ index: 0, length: 0 })).toEqual(true);

  expect(isPoint({ index: 2, length: 0 })).toEqual(true);

  expect(isPoint({ index: 2, length: 2 })).toEqual(false);
});

test('mergeVRange', () => {
  expect(mergeVRange({ index: 0, length: 0 }, { index: 1, length: 0 })).toEqual(
    {
      index: 0,
      length: 1,
    }
  );

  expect(mergeVRange({ index: 0, length: 0 }, { index: 0, length: 0 })).toEqual(
    {
      index: 0,
      length: 0,
    }
  );

  expect(mergeVRange({ index: 1, length: 0 }, { index: 2, length: 0 })).toEqual(
    {
      index: 1,
      length: 1,
    }
  );

  expect(mergeVRange({ index: 2, length: 0 }, { index: 1, length: 0 })).toEqual(
    {
      index: 1,
      length: 1,
    }
  );

  expect(mergeVRange({ index: 1, length: 3 }, { index: 2, length: 2 })).toEqual(
    {
      index: 1,
      length: 3,
    }
  );

  expect(mergeVRange({ index: 2, length: 2 }, { index: 1, length: 1 })).toEqual(
    {
      index: 1,
      length: 3,
    }
  );

  expect(mergeVRange({ index: 3, length: 2 }, { index: 2, length: 1 })).toEqual(
    {
      index: 2,
      length: 3,
    }
  );

  expect(mergeVRange({ index: 0, length: 4 }, { index: 1, length: 1 })).toEqual(
    {
      index: 0,
      length: 4,
    }
  );

  expect(mergeVRange({ index: 1, length: 1 }, { index: 0, length: 4 })).toEqual(
    {
      index: 0,
      length: 4,
    }
  );

  expect(mergeVRange({ index: 0, length: 2 }, { index: 1, length: 3 })).toEqual(
    {
      index: 0,
      length: 4,
    }
  );
});

test('intersectVRange', () => {
  expect(
    intersectVRange({ index: 0, length: 0 }, { index: 1, length: 0 })
  ).toEqual(null);

  expect(
    intersectVRange({ index: 0, length: 2 }, { index: 1, length: 1 })
  ).toEqual({ index: 1, length: 1 });

  expect(
    intersectVRange({ index: 0, length: 2 }, { index: 2, length: 0 })
  ).toEqual({ index: 2, length: 0 });

  expect(
    intersectVRange({ index: 1, length: 0 }, { index: 1, length: 0 })
  ).toEqual({ index: 1, length: 0 });

  expect(
    intersectVRange({ index: 1, length: 3 }, { index: 2, length: 2 })
  ).toEqual({ index: 2, length: 2 });

  expect(
    intersectVRange({ index: 1, length: 2 }, { index: 0, length: 3 })
  ).toEqual({ index: 1, length: 2 });

  expect(
    intersectVRange({ index: 1, length: 1 }, { index: 2, length: 2 })
  ).toEqual({ index: 2, length: 0 });

  expect(
    intersectVRange({ index: 2, length: 2 }, { index: 1, length: 3 })
  ).toEqual({ index: 2, length: 2 });

  expect(
    intersectVRange({ index: 2, length: 1 }, { index: 1, length: 1 })
  ).toEqual({ index: 2, length: 0 });

  expect(
    intersectVRange({ index: 0, length: 4 }, { index: 1, length: 2 })
  ).toEqual({ index: 1, length: 2 });
});
