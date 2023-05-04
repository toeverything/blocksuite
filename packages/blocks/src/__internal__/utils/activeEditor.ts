import { Slot } from '@blocksuite/global/utils';

let activeElement: Element | null = null;
export const setActive = (ele: Element) => {
  if (ele !== activeElement) {
    activeElement = ele;
    activeSlot.emit(ele);
  }
};

export const setIfNoActive = (ele: Element) => {
  if (!activeElement) {
    activeElement = ele;
  }
};

export const clearActive = () => {
  if (activeElement != null) {
    activeElement = null;
    activeSlot.emit(null);
  }
};
export const isActive = (ele: Element) => {
  if (!activeElement) {
    return false;
  }
  return activeElement.contains(ele);
};

export const activeSlot = new Slot<Element | null>();
