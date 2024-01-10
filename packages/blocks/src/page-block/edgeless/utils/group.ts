import { GroupElementModel } from '../../../surface-block/index.js';
import type { EdgelessElement } from '../type.js';

export function getElementsWithoutGroup(elements: EdgelessElement[]) {
  const set = new Set<EdgelessElement>();

  elements.forEach(element => {
    if (element instanceof GroupElementModel) {
      element.decendants().forEach(child => set.add(child));
    } else {
      set.add(element);
    }
  });
  return Array.from(set);
}
