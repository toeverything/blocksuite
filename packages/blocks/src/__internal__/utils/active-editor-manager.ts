import { Slot } from '@blocksuite/global/utils';
export class ActiveEditorManager {
  activeSlot = new Slot<Element | undefined>();
  activeElement?: Element;
  isActive(ele: Element) {
    if (!this.activeElement) {
      return false;
    }
    return this.activeElement.contains(ele);
  }

  setActive(ele: Element) {
    if (ele !== this.activeElement) {
      this.activeElement = ele;
      this.activeSlot.emit(ele);
    }
  }
  clearActive = () => {
    if (this.activeElement != undefined) {
      this.activeElement = undefined;
      this.activeSlot.emit(undefined);
    }
  };
  setIfNoActive(ele: Element) {
    if (!this.activeElement) {
      this.setActive(ele);
    }
  }

  getActiveEditor() {
    return this.activeElement;
  }
}
export const activeEditorManager = new ActiveEditorManager();
