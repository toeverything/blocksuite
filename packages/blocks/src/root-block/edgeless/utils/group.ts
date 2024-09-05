import { GroupElementModel } from '@blocksuite/affine-model';
export function getElementsWithoutGroup(elements: BlockSuite.EdgelessModel[]) {
  const set = new Set<BlockSuite.EdgelessModel>();

  elements.forEach(element => {
    // TODO(@L-Sun) Use `getAllDescendantElements` instead
    if (element instanceof GroupElementModel) {
      element.descendants().forEach(child => set.add(child));
    } else {
      set.add(element);
    }
  });
  return Array.from(set);
}
