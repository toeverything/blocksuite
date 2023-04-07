import { describe, expect, it } from 'vitest';

import { Rectangle } from '../rectangle.js';
import { createNodes } from './create-nodes.js';
import { createRulers } from './create-rulers.js';

describe('createNodes', () => {
  it('basic', () => {
    const margin = 10;
    const rects = [
      new Rectangle(30, 30, 200, 200),
      new Rectangle(160, 160, 300, 300),
    ].map(r => r.inflate(margin, margin));
    const points = [
      { x: 130, y: 30 },
      { x: 160, y: 310 },
    ];

    const rulers = createRulers(rects, points, [margin, margin]);
    const nodes = createNodes(rulers, rects, points);
    const nodesStr = nodes.map(n => `${n.x}:${n.y}`).join(',');

    const result =
      '10:10,20:10,75:10,130:10,140:10,150:10,155:10,160:10,200:10,240:10,355:10,470:10,480:10,10:20,10:25,355:20,355:25,470:20,470:25,480:20,480:25,10:30,10:90,355:30,355:90,470:30,470:90,480:30,480:90,10:150,10:195,480:150,480:195,10:240,10:275,20:275,75:275,130:275,140:275,480:240,480:275,10:310,10:390,20:310,75:310,20:390,75:390,130:310,140:310,130:390,140:390,480:310,480:390,10:470,20:470,75:470,130:470,140:470,480:470,10:480,20:480,75:480,130:480,140:480,150:480,155:480,160:480,200:480,240:480,355:480,470:480,480:480,130:30,130:25,130:20,160:310,155:310,150:310';
    expect(nodesStr).toBe(result);
  });
});
