import type { EdgelessElement } from '../../../_common/utils/index.js';
import { Bound } from '../../../surface-block/index.js';
import { isTopLevelBlock } from './query.js';

export function getGridBound(ele: EdgelessElement) {
  return isTopLevelBlock(ele) ? Bound.deserialize(ele.xywh) : ele.gridBound;
}

export function edgelessElementsBound(elements: EdgelessElement[]) {
  if (elements.length === 0) return new Bound();
  return elements.reduce((prev, element) => {
    return prev.unite(getGridBound(element));
  }, getGridBound(elements[0]));
}
