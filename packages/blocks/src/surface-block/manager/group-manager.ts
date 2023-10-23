import { assertExists } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';

import type { EdgelessElement } from '../../_common/utils/index.js';
import { PhasorElementType } from '../elements/edgeless-element.js';
import { groupRootId } from '../elements/group/contants.js';
import { GroupElement } from '../elements/group/group-element.js';
import type { SurfaceBlockComponent } from '../surface-block.js';

export function getElementsFromGroup(group: GroupElement) {
  const elements: EdgelessElement[] = [];
  group.childrenElements.forEach(child => {
    if (child instanceof GroupElement) {
      elements.push(...getElementsFromGroup(child));
    } else {
      elements.push(child);
    }
  });
  return elements;
}

export function getElementsWithoutGroup(elements: EdgelessElement[]) {
  const set = new Set<EdgelessElement>();
  elements.forEach(ele => {
    if (ele instanceof GroupElement) {
      getElementsFromGroup(ele).forEach(child => {
        set.add(child);
      });
    } else {
      set.add(ele);
    }
  });
  return Array.from(set);
}

export function getRootElements(elements: EdgelessElement[]) {
  return elements.filter(ele => ele.group === groupRootId);
}

export class GroupManager {
  constructor(private surface: SurfaceBlockComponent) {}

  createGroupOnSelected() {
    const { surface } = this;
    const { edgeless } = surface;
    const { selectionManager } = edgeless;
    if (selectionManager.elements.length <= 1) return;

    const map = new Workspace.Y.Map<boolean>();
    let isValid = true;
    selectionManager.elements.forEach(ele => {
      map.set(ele.id, true);
      if (ele.group !== selectionManager.firstElement.group) {
        isValid = false;
      }
    });
    if (!isValid) return;

    const parentGroup = selectionManager.firstElement.group;
    const parent = surface.pickById(parentGroup) as GroupElement;
    if (parent) {
      selectionManager.elements.forEach(ele => {
        parent.removeChild(ele.id);
      });
    }
    const groupId = surface.addElement(PhasorElementType.GROUP, {
      children: map,
    });

    if (parent) {
      parent.addChild(groupId);
    }

    selectionManager.setSelection({
      editing: false,
      elements: [groupId],
    });
  }

  isGroupAncestor(self: EdgelessElement, group: GroupElement) {
    if (self.group === group.id) return true;
    while (self.group !== groupRootId) {
      self = this.surface.pickById(self.group)!;
      assertExists(self);
      if (self.group === group.id) return true;
    }
    return false;
  }

  releaseFromGroup(element: EdgelessElement) {
    if (element.group === groupRootId) return;

    const group = this.surface.pickById(element.group) as GroupElement;

    group.removeChild(element.id);

    const parent = this.surface.pickById(group.group) as GroupElement;
    if (parent) {
      parent.addChild(element.id);
    }
  }

  unGroup(group: GroupElement) {
    const { surface } = this;
    const { edgeless } = surface;
    const { selectionManager } = edgeless;
    const elements = group.childrenElements;
    const parent = surface.pickById(group.group) as GroupElement;
    if (parent) {
      parent.removeChild(group.id);
    }
    surface.removeElement(group.id);
    if (parent) {
      elements.forEach(ele => {
        parent.addChild(ele.id);
      });
    }
    selectionManager.setSelection({
      editing: false,
      elements: elements.map(ele => ele.id),
    });
  }
}
