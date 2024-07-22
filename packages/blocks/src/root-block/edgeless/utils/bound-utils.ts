import { Bound } from '@blocksuite/global/utils';

export function edgelessElementsBound(
  elements: BlockSuite.EdgelessModelType[]
) {
  if (elements.length === 0) return new Bound();
  return elements.reduce((prev, element) => {
    return prev.unite(element.elementBound);
  }, elements[0].elementBound);
}
