import { deserializeXYWH } from '../../../surface-block/index.js';
import type { EdgelessBlockModel } from '../edgeless-block-model.js';

export function xywhArrayToObject(element: EdgelessBlockModel) {
  const [x, y, w, h] = deserializeXYWH(element.xywh);
  return { x, y, w, h };
}
