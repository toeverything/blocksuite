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
export class EdgelessGroupManager {
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
      if (
        surface.getGroup(ele) !==
        surface.getGroup(selectionManager.firstElement)
      ) {
        isValid = false;
      }
    });
    if (!isValid) return;

    const parentGroup = surface.getGroup(selectionManager.firstElement);
    const parent = surface.pickById(parentGroup) as GroupElement;
    if (parent) {
      selectionManager.elements.forEach(ele => {
        parent.removeChild(ele.id);
      });
    }
    const groups = surface.getElementsByType(PhasorElementType.GROUP);
    const groupId = surface.addElement(PhasorElementType.GROUP, {
      children: map,
      title: new Workspace.Y.Text(`Group ${groups.length + 1}`),
    });

    if (parent) {
      parent.addChild(groupId);
    }

    selectionManager.setSelection({
      editing: false,
      elements: [groupId],
    });
  }

  isGroupAncestor(ele: EdgelessElement, group: GroupElement) {
    const { surface } = this;
    if (surface.getGroup(ele) === group.id) return true;
    while (surface.getGroup(ele) !== GROUP_ROOT_ID) {
      ele = this.surface.pickById(surface.getGroup(ele))!;
      assertExists(ele);
      if (surface.getGroup(ele) === group.id) return true;
    }
    return false;
  }

  releaseFromGroup(element: EdgelessElement) {
    if (this.surface.getGroup(element) === GROUP_ROOT_ID) return;

    const group = this.surface.pickById(
      this.surface.getGroup(element)
    ) as GroupElement;

    group.removeChild(element.id);

    const parent = this.surface.pickById(
      this.surface.getGroup(group)
    ) as GroupElement;
    if (parent) {
      parent.addChild(element.id);
    }
  }

  ungroup(group: GroupElement) {
    const { surface } = this;
    const { edgeless } = surface;
    const { selectionManager } = edgeless;
    const elements = group.childElements;
    const parent = surface.pickById(surface.getGroup(group)) as GroupElement;
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

  getRootElements(elements: EdgelessElement[]) {
    return elements.filter(ele => this.surface.getGroup(ele) === GROUP_ROOT_ID);
  }
}
