import type { EdgelessElement } from '../../../_common/utils/index.js';
import { Bound } from '../../../surface-block/index.js';

export function edgelessElementsBound(elements: EdgelessElement[]) {
  if (elements.length === 0) return new Bound();
  return elements.reduce((prev, element) => {
    return prev.unite(element.elementBound);
  }, elements[0].elementBound);
}
