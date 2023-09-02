import type { EdgelessElement } from '../../../index.js';
import { Bound } from '../../../surface-block/index.js';
import type { Selectable } from '../services/tools-manager.js';
import { isTopLevelBlock } from './query.js';

export function getGridBound(ele: Selectable) {
  return isTopLevelBlock(ele) ? Bound.deserialize(ele.xywh) : ele.gridBound;
}

export function edgelessElementsBound(elements: EdgelessElement[]) {
  return elements.reduce((prev, element) => {
    return prev.unite(getGridBound(element));
  }, getGridBound(elements[0]));
}
