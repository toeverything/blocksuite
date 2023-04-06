import { describe, expect, it } from 'vitest';

import { simplifyPath } from './simplify-path.js';

describe('simplify path', () => {
  it('default `tolerance=0`', () => {
    const points = [
      { x: 1184, y: 396.5 },
      { x: 1226, y: 396.5 },
      { x: 1226, y: 396 },
      { x: 1226, y: 395.5 },
      { x: 1226, y: 395.5 },
      { x: 1268, y: 395.5 },
    ];

    const tolerance0 = [
      { x: 1184, y: 396.5 },
      { x: 1226, y: 396.5 },
      { x: 1226, y: 395.5 },
      { x: 1268, y: 395.5 },
    ];

    expect(simplifyPath(points)).toMatchObject(tolerance0);
  });

  it('path length <= 2', () => {
    const path = [
      { x: 0, y: 1 },
      { x: 0, y: 1 },
    ];
    expect(simplifyPath(path)).toMatchObject(path);
  });

  it('path length = 0', () => {
    const simplified = simplifyPath([]);
    expect(simplified.length).toEqual(0);
  });
});
