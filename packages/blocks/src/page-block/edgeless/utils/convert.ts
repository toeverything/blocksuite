import type { TopLevelBlockModel } from '../../../_common/types.js';
import { deserializeXYWH } from '../../../surface-block/index.js';

export function xywhArrayToObject(element: TopLevelBlockModel) {
  const [x, y, w, h] = deserializeXYWH(element.xywh);
  return { x, y, w, h };
}
