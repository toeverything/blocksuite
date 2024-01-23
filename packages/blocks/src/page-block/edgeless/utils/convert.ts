import { deserializeXYWH } from '../../../surface-block/index.js';
import type { EdgelessBlockModel } from '../type.js';

export function xywhArrayToObject(element: EdgelessBlockModel) {
  const [x, y, w, h] = deserializeXYWH(element.xywh);
  return { x, y, w, h };
}
