import { Rectangle } from '@blocksuite/connector';
import { describe, expect, it } from 'vitest';

import {
  generatePath,
  getAttachedPoint,
  getAttachedPointByDirection,
} from './utils.js';

describe('page-block edgeless utils', () => {
  it('getAttachedPointByDirection', () => {
    const rect = new Rectangle(10, 10, 20, 20);

    const left = getAttachedPointByDirection(rect, 'left');
    expect(left).toMatchObject({ x: 10, y: 20 });

    const right = getAttachedPointByDirection(rect, 'right');
    expect(right).toMatchObject({ x: 30, y: 20 });

    const top = getAttachedPointByDirection(rect, 'top');
    expect(top).toMatchObject({ x: 20, y: 10 });

    const bottom = getAttachedPointByDirection(rect, 'bottom');
    expect(bottom).toMatchObject({ x: 20, y: 30 });
  });

  it('getAttachedPoint with no rect', () => {
    const ret = getAttachedPoint(10, 10);
    expect(ret).toMatchObject({ point: { x: 10, y: 10 }, direction: 'left' });
  });

  it('generatePath with fixed', () => {
    const startRect = new Rectangle(30, 30, 200, 200);
    const endRect = new Rectangle(130, 130, 300, 300);
    const startPoint = { x: 130, y: 30 };
    const endPoint = { x: 160, y: 310 };
    const controllers = [
      { x: 10, y: 10 },
      { x: 10, y: 100 },
      { x: 20, y: 100, customized: true },
      { x: 20, y: 50, customized: true },
      { x: 25, y: 50 },
      { x: 25, y: 40 },
    ];

    const pathWithFixedStart = generatePath(
      startRect,
      endRect,
      startPoint,
      endPoint,
      controllers,
      'start'
    );
    expect(pathWithFixedStart).not.toMatchObject(controllers);
    expect(pathWithFixedStart.slice(0, 4)).toMatchObject(
      controllers.slice(0, 4)
    );

    const pathWithFixedEnd = generatePath(
      startRect,
      endRect,
      startPoint,
      endPoint,
      controllers,
      'end'
    );
    expect(pathWithFixedEnd).not.toMatchObject(controllers);
    expect(pathWithFixedEnd.slice(-4)).toMatchObject(controllers.slice(-4));
  });
});
