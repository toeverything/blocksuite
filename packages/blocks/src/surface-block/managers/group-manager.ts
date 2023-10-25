import { assertExists } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';

import type { EdgelessElement } from '../../_common/utils/index.js';
import { PhasorElementType } from '../elements/edgeless-element.js';
import { GROUP_ROOT_ID } from '../elements/group/consts.js';
import { GroupElement } from '../elements/group/group-element.js';
import type { SurfaceBlockComponent } from '../surface-block.js';

export function getElementsFromGroup(group: GroupElement) {
  const elements: EdgelessElement[] = [];
  group.childElements.forEach(child => {
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
  elements.forEach(element => {
    if (element instanceof GroupElement) {
      getElementsFromGroup(element).forEach(child => {
        set.add(child);
      });
    } else {
      set.add(element);
    }
  });
  return Array.from(set);
}

export class EdgelessGroupManager {
  constructor(private surface: SurfaceBlockComponent) {}

  addChild(group: GroupElement, id: string) {
    this.surface.transact(() => {
      group.children.set(id, true);
    });
  }

  removeChild(group: GroupElement, id: string) {
    this.surface.transact(() => {
      group.children.delete(id);
    });
  }

  createGroupOnSelected() {
    const { surface } = this;
    const { edgeless } = surface;
    const { selectionManager } = edgeless;
    if (selectionManager.elements.length <= 1) return;

    const map = new Workspace.Y.Map<boolean>();
    let isValid = true;
    selectionManager.elements.forEach(element => {
      map.set(element.id, true);
      if (
        surface.getGroupParent(element) !==
        surface.getGroupParent(selectionManager.firstElement)
      ) {
        isValid = false;
      }
    });
    if (!isValid) return;

    const parentGroup = surface.getGroupParent(selectionManager.firstElement);
    const parent = surface.pickById(parentGroup) as GroupElement;
    if (parent) {
      selectionManager.elements.forEach(element => {
        this.removeChild(parent, element.id);
      });
    }
    const groups = surface.getElementsByType(PhasorElementType.GROUP);
    const groupId = surface.addElement(PhasorElementType.GROUP, {
      children: map,
      title: new Workspace.Y.Text(`Group ${groups.length + 1}`),
    });

    if (parent) {
      this.addChild(parent, groupId);
    }

    selectionManager.setSelection({
      editing: false,
      elements: [groupId],
    });
  }

  isDescendant(element: EdgelessElement, parent: GroupElement) {
    const { surface } = this;
    if (surface.getGroupParent(element) === parent.id) return true;

    while (surface.getGroupParent(element) !== GROUP_ROOT_ID) {
      element = this.surface.pickById(surface.getGroupParent(element))!;
      assertExists(element);
      if (surface.getGroupParent(element) === parent.id) return true;
    }

    return false;
  }

  releaseFromGroup(element: EdgelessElement) {
    if (this.surface.getGroupParent(element) === GROUP_ROOT_ID) return;

    const group = this.surface.pickById(
      this.surface.getGroupParent(element)
    ) as GroupElement;

    this.removeChild(group, element.id);

    const parent = this.surface.pickById(
      this.surface.getGroupParent(group)
    ) as GroupElement;
    if (parent) {
      this.addChild(parent, element.id);
    }
  }

  ungroup(group: GroupElement) {
    const { surface } = this;
    const { edgeless } = surface;
    const { selectionManager } = edgeless;
    const elements = group.childElements;
    const parent = surface.pickById(
      surface.getGroupParent(group)
    ) as GroupElement;
    if (parent) {
      this.removeChild(parent, group.id);
    }
    surface.removeElement(group.id);
    if (parent) {
      elements.forEach(element => {
        this.addChild(parent, element.id);
      });
    }
    selectionManager.setSelection({
      editing: false,
      elements: elements.map(ele => ele.id),
    });
  }

  getRootElements(elements: EdgelessElement[]) {
    return elements.filter(
      element => this.surface.getGroupParent(element) === GROUP_ROOT_ID
    );
  }
}
