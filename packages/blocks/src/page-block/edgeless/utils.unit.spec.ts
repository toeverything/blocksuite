import { Rectangle } from '@blocksuite/connector';
import { ConnectorMode } from '@blocksuite/phasor';
import { describe, expect, it } from 'vitest';

import { generateConnectorPath, getAttachedPoint } from './utils.js';

describe('page-block edgeless utils', () => {
  it('getAttachedPoint with no rect', () => {
    const ret = getAttachedPoint(10, 10);
    expect(ret).toMatchObject({ point: { x: 10, y: 10 }, position: null });
  });

  it('getAttachedPoint with point not in rect', () => {
    const rect = new Rectangle(10, 10, 100, 100);
    const ret = getAttachedPoint(0, 0, rect);
    expect(ret).toMatchObject({ point: { x: 0, y: 0 }, position: null });
  });

  it('getAttachedPoint return origin point', () => {
    const rect = new Rectangle(10, 10, 100, 100);
    const ret = getAttachedPoint(20, 30, rect);
    expect(ret).toMatchObject({
      point: { x: 20, y: 30 },
      position: { x: 0.1, y: 0.2 },
    });
  });

  it('getAttachedPoint return fixed point', () => {
    const rect = new Rectangle(10, 10, 100, 100);
    const ret = getAttachedPoint(10, 50, rect);
    expect(ret).toMatchObject({
      point: { x: 10, y: 60 },
      position: { x: 0, y: 0.4 },
    });
  });

  it('generateConnectorPath with fixed', () => {
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

    const pathWithFixedStart = generateConnectorPath(
      startRect,
      endRect,
      startPoint,
      endPoint,
      controllers,
      ConnectorMode.Orthogonal,
      'start'
    );
    expect(pathWithFixedStart).not.toMatchObject(controllers);
    expect(pathWithFixedStart.slice(0, 4)).toMatchObject(
      controllers.slice(0, 4)
    );

    const pathWithFixedEnd = generateConnectorPath(
      startRect,
      endRect,
      startPoint,
      endPoint,
      controllers,
      ConnectorMode.Orthogonal,
      'end'
    );
    expect(pathWithFixedEnd).not.toMatchObject(controllers);
    expect(pathWithFixedEnd.slice(-4)).toMatchObject(controllers.slice(-4));

    const pathStraight = generateConnectorPath(
      startRect,
      endRect,
      startPoint,
      endPoint,
      controllers,
      ConnectorMode.Straight,
      'end'
    );
    expect(pathStraight).toMatchObject([startPoint, endPoint]);
  });
});
