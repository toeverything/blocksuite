import { GroupNode } from '../../../surface-block/index.js';
export function getElementsWithoutGroup(
  elements: BlockSuite.EdgelessModelType[]
) {
  const set = new Set<BlockSuite.EdgelessModelType>();

  elements.forEach(element => {
    if (element instanceof GroupNode) {
      element.descendants().forEach(child => set.add(child));
    } else {
      set.add(element);
    }
  });
  return Array.from(set);
}
