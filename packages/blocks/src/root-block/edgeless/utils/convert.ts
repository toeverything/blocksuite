import { deserializeXYWH } from '@blocksuite/global/utils';

import type { BlockNode } from '../edgeless-block-node.js';

export function xywhArrayToObject(element: BlockNode) {
  const [x, y, w, h] = deserializeXYWH(element.xywh);
  return { x, y, w, h };
}
