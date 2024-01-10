import { assertExists } from '@blocksuite/global/utils';

import type { EdgelessElement } from '../../page-block/edgeless/type.js';
import { GroupElementModel } from '../element-model/group.js';
import { GROUP_ROOT } from '../elements/group/consts.js';
import type { SurfaceBlockComponent } from '../surface-block.js';

export const GroupMap = new Map<string, GroupElementModel>(); // { blockId: groupId }

export function getGroupParent(element: string | EdgelessElement) {
  const id = typeof element === 'string' ? element : element.id;
  return GroupMap.get(id) ?? (GROUP_ROOT as GroupElementModel);
}

export function setGroupParent(id: string, group: GroupElementModel) {
  if (group === GROUP_ROOT) {
    GroupMap.delete(id);
    return;
  }
  GroupMap.set(id, group);
}

export function getGroups(element: EdgelessElement) {
  let group = getGroupParent(element);
  const groups: { group: GroupElementModel; child: EdgelessElement }[] = [];
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
  } else if (a instanceof GroupElementModel && isDescendant(b, a)) {
    return -1;
  } else if (b instanceof GroupElementModel && isDescendant(a, b)) {
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

export function isDescendant(_: EdgelessElement, __: GroupElementModel) {
  throw new Error('reimplementate this, move to group element model');
}

export function getElementsFromGroup(group: GroupElementModel) {
  const elements: EdgelessElement[] = [];
  group.childElements.forEach(child => {
    if (child instanceof GroupElementModel) {
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
    if (element instanceof GroupElementModel) {
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

  addChild(group: GroupElementModel, id: string) {
    throw new Error('reimplementate this, move to group element model');

    this.surfaceModel.page.transact(() => {
      group.children.set(id, true);
    });
  }

  removeChild(group: GroupElementModel, id: string) {
    throw new Error('reimplementate this, move to group element model');

    this.surfaceModel.page.transact(() => {
      group.children.delete(id);
    });
  }

  createGroupOnSelected() {
    throw new Error('reimplementate this, move to surface model');

    // const { surface } = this;
    // const { edgeless } = surface;
    // const { selectionManager } = edgeless;
    // if (selectionManager.elements.length <= 0) return;

    // const map = new Workspace.Y.Map<boolean>();
    // let isValid = true;
    // selectionManager.elements.forEach(element => {
    //   map.set(element.id, true);
    //   if (
    //     surface.getGroupParent(element) !==
    //     surface.getGroupParent(selectionManager.firstElement)
    //   ) {
    //     isValid = false;
    //   }
    // });
    // if (!isValid) return;

    // const parent = surface.getGroupParent(selectionManager.firstElement);
    // if (parent !== GROUP_ROOT) {
    //   selectionManager.elements.forEach(element => {
    //     this.removeChild(parent, element.id);
    //   });
    // }
    // const groups = surface.getElementsByType(CanvasElementType.GROUP);
    // const groupId = surface.addElement(CanvasElementType.GROUP, {
    //   children: map,
    //   title: new Workspace.Y.Text(`Group ${groups.length + 1}`),
    // });

    // if (parent !== GROUP_ROOT) {
    //   this.addChild(parent, groupId);
    // }

    // selectionManager.set({
    //   editing: false,
    //   elements: [groupId],
    // });
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

  releaseFromGroup(_: EdgelessElement) {
    throw new Error('reimplementate this, can be combined with removeChild');
  }

  ungroup(_: GroupElementModel) {
    throw new Error('reimplementate this, move to group element model');
  }

  getRootElements(elements: EdgelessElement[]) {
    return elements.filter(
      element => this.surface.getGroupParent(element) === GROUP_ROOT
    );
  }
}
