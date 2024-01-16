import { deserializeXYWH } from '../../../surface-block/index.js';
import type { EdgelessBlock } from '../type.js';

export function xywhArrayToObject(element: EdgelessBlock) {
  const [x, y, w, h] = deserializeXYWH(element.xywh);
  return { x, y, w, h };
}
