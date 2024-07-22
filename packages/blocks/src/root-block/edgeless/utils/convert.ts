import { deserializeXYWH } from '@blocksuite/global/utils';

import type { EdgelessBlockNode } from '../edgeless-block-node.js';

export function xywhArrayToObject(element: EdgelessBlockNode) {
  const [x, y, w, h] = deserializeXYWH(element.xywh);
  return { x, y, w, h };
}
