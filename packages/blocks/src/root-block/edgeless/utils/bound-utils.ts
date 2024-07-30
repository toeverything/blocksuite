import { Bound } from '@blocksuite/global/utils';

import { SurfaceGroupLikeModel } from '../../../surface-block/element-model/base.js';

export function edgelessElementsBound(elements: BlockSuite.EdgelessModel[]) {
  if (elements.length === 0) return new Bound();
  return elements.reduce((prev, element) => {
    if (element instanceof SurfaceGroupLikeModel) {
      return prev;
    }
    return prev.unite(element.elementBound);
  }, elements[0].elementBound);
}
