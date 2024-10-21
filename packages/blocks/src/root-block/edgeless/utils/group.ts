import { GroupElementModel } from '@blocksuite/affine-model';
export function getElementsWithoutGroup(elements: BlockSuite.EdgelessModel[]) {
  const set = new Set<BlockSuite.EdgelessModel>();

  elements.forEach(element => {
    if (element instanceof GroupElementModel) {
      element.descendantElements
        .filter(descendant => !(descendant instanceof GroupElementModel))
        .forEach(descendant => set.add(descendant));
    } else {
      set.add(element);
    }
  });
  return Array.from(set);
}
