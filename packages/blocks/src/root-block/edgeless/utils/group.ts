import { GroupElementModel } from '../../../surface-block/index.js';
export function getElementsWithoutGroup(elements: BlockSuite.EdgelessModel[]) {
  const set = new Set<BlockSuite.EdgelessModel>();

  elements.forEach(element => {
    if (element instanceof GroupElementModel) {
      element.descendants().forEach(child => set.add(child));
    } else {
      set.add(element);
    }
  });
  return Array.from(set);
}
