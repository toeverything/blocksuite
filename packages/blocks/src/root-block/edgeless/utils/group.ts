import { GroupElementModel } from '../../../surface-block/index.js';
import type { EdgelessModel } from '../type.js';

export function getElementsWithoutGroup(elements: EdgelessModel[]) {
  const set = new Set<EdgelessModel>();

  elements.forEach(element => {
    if (element instanceof GroupElementModel) {
      element.decendants().forEach(child => set.add(child));
    } else {
      set.add(element);
    }
  });
  return Array.from(set);
}
