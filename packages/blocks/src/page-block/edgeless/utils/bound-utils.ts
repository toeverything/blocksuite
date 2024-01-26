import { Bound } from '../../../surface-block/index.js';
import type { EdgelessModel } from '../../edgeless/type.js';

export function edgelessElementsBound(elements: EdgelessModel[]) {
  if (elements.length === 0) return new Bound();
  return elements.reduce((prev, element) => {
    return prev.unite(element.elementBound);
  }, elements[0].elementBound);
}
