import { assertExists } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';

import type { EdgelessElement } from '../../_common/utils/index.js';
import { CanvasElementType } from '../elements/edgeless-element.js';
import { GROUP_ROOT } from '../elements/group/consts.js';
import { GroupElement } from '../elements/group/group-element.js';
import type { SurfaceBlockComponent } from '../surface-block.js';

export const GroupMap = new Map<string, GroupElement>(); // { blockId: groupId }

export function getGroupParent(element: string | EdgelessElement) {
  const id = typeof element === 'string' ? element : element.id;
  return GroupMap.get(id) ?? (GROUP_ROOT as GroupElement);
}

export function setGroupParent(
  element: string | EdgelessElement,
  group: GroupElement
) {
  const id = typeof element === 'string' ? element : element.id;
  if (group === GROUP_ROOT) {
    GroupMap.delete(id);
    return;
  }
  GroupMap.set(id, group);
}

export function getGroups(element: EdgelessElement) {
  let group = getGroupParent(element);
  const groups: { group: GroupElement; child: EdgelessElement }[] = [];
  groups.push({ group: group, child: element });
  while (group !== GROUP_ROOT) {
    element = group;
    group = getGroupParent(group);
    groups.push({ group: group, child: element });
  }
  return groups;
}

export function compare(a: EdgelessElement, b: EdgelessElement) {
  if (getGroupParent(a) === getGroupParent(b)) {
    if (a.index < b.index) return -1;
    else if (a.index > b.index) return 1;
  } else if (a instanceof GroupElement && isDescendant(b, a)) {
    return -1;
  } else if (b instanceof GroupElement && isDescendant(a, b)) {
    return 1;
  } else {
    const aGroups = getGroups(a);
    const bGroups = getGroups(b);

    for (let i = 0; i < aGroups.length; i++) {
      for (let j = 0; j < bGroups.length; j++) {
        const aGroup = aGroups[i];
        const bGroup = bGroups[j];
        if (aGroup.group === bGroup.group) {
          const aChild = aGroup.child;
          const bChild = bGroup.child;
          assertExists(aChild);
          assertExists(bChild);
          if (aChild.index < bChild.index) return -1;
          else if (aChild.index > bChild.index) return 1;
          return 0;
        }
      }
    }
  }

  if (a.index < b.index) return -1;
  else if (a.index > b.index) return 1;
  return 0;
}

export function isDescendant(element: EdgelessElement, parent: GroupElement) {
  if (getGroupParent(element) === parent) return true;

  while (getGroupParent(element) !== GROUP_ROOT) {
    element = getGroupParent(element)!;
    assertExists(element);
    if (getGroupParent(element) === parent) return true;
  }

  return false;
}

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

    const parent = surface.getGroupParent(selectionManager.firstElement);
    if (parent !== GROUP_ROOT) {
      selectionManager.elements.forEach(element => {
        this.removeChild(parent, element.id);
      });
    }
    const groups = surface.getElementsByType(CanvasElementType.GROUP);
    const groupId = surface.addElement(CanvasElementType.GROUP, {
      children: map,
      title: new Workspace.Y.Text(`Group ${groups.length + 1}`),
    });

    if (parent !== GROUP_ROOT) {
      this.addChild(parent, groupId);
    }

    selectionManager.setSelection({
      editing: false,
      elements: [groupId],
    });
  }

  getRootElement(element: EdgelessElement) {
    const { surface } = this;
    let group = surface.getGroupParent(element);
    while (group !== GROUP_ROOT) {
      element = group;
      group = surface.getGroupParent(group);
    }
    return element;
  }

  releaseFromGroup(element: EdgelessElement) {
    if (this.surface.getGroupParent(element) === GROUP_ROOT) return;

    const group = this.surface.getGroupParent(element);

    this.removeChild(group, element.id);

    const indexes = this.surface.getIndexes(group, 'after');
    indexes && this.surface.updateIndexes(indexes, [element]);

    const parent = this.surface.getGroupParent(group);
    if (parent != GROUP_ROOT) {
      this.addChild(parent, element.id);
    }
  }

  ungroup(group: GroupElement) {
    const { surface } = this;
    const { edgeless } = surface;
    const { selectionManager } = edgeless;
    const elements = group.childElements;
    const parent = surface.getGroupParent(group);
    if (parent !== GROUP_ROOT) {
      this.removeChild(parent, group.id);
    }

    const indexes = this.surface.getIndexes(group, 'after', elements.length);
    indexes && this.surface.updateIndexes(indexes, elements);

    surface.removeElement(group.id);
    if (parent !== GROUP_ROOT) {
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
      element => this.surface.getGroupParent(element) === GROUP_ROOT
    );
  }
}
