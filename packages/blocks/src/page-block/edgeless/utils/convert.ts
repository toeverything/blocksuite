import type { TopLevelBlockModel } from '../../../__internal__/utils/types.js';

export function xywhArrayToObject(element: TopLevelBlockModel) {
  const [x, y, w, h] = element.xywh;
  return { x, y, w, h };
}
