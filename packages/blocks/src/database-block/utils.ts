import type { BaseBlockModel, Y } from '@blocksuite/store';
import {
  type BaseTextAttributes,
  VEditor,
  type VEditorOptions,
} from '@blocksuite/virgo';
import type { VirgoEventService } from '@blocksuite/virgo/services/event';

import { setupVirgoScroll } from '../__internal__/utils/virgo.js';
import type { DatabaseAction, Divider } from './types.js';

// source (2018-03-11): https://github.com/jquery/jquery/blob/master/src/css/hiddenVisibleSelectors.js
function isVisible(elem: HTMLElement) {
  return (
    !!elem &&
    !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length)
  );
}

export function onClickOutside(
  element: HTMLElement,
  callback: (element: HTMLElement) => void,
  event: 'click' | 'mousedown' = 'click'
): () => void {
  const outsideClickListener = (event: Event) => {
    if (!element.contains(event.target as Node) && isVisible(element)) {
      // or use: event.target.closest(selector) === null
      callback(element);
      removeClickListener();
    }
  };

  document.addEventListener(event, outsideClickListener);

  const removeClickListener = () => {
    document.removeEventListener(event, outsideClickListener);
  };

  return removeClickListener;
}

/** select tag color poll */
const tagColorPoll: string[] = [
  '#F5F5F5',
  '#E3E2E0',
  '#FFE1E1',
  '#FFEACA',
  '#FFF4D8',
  '#DFF4E8',
  '#DFF4F3',
  '#E1EFFF',
  '#F3F0FF',
  '#FCE8FF',
];

function tagColorHelper() {
  let colors = [...tagColorPoll];
  return () => {
    if (colors.length === 0) {
      colors = [...tagColorPoll];
    }
    const index = Math.floor(Math.random() * colors.length);
    const color = colors.splice(index, 1)[0];
    return color;
  };
}

export const getTagColor = tagColorHelper();

export function isDivider(action: DatabaseAction): action is Divider {
  return action.type === 'divider';
}

type InitLimitedLengthVEditorConfig = {
  yText: Y.Text | string;
  container: HTMLElement;
  targetModel: BaseBlockModel;
  maxLength: number;
  handlers: VirgoEventService<BaseTextAttributes>['_handlers'];
  options?: VEditorOptions;
};
export function initLimitedLengthVEditor({
  yText,
  container,
  targetModel,
  maxLength,
  handlers,
  options = {
    defaultMode: 'rich',
  },
}: InitLimitedLengthVEditorConfig) {
  const handleInput = (event: InputEvent) => {
    const length = vEditor.yText.length;
    if (length >= maxLength && event.data) {
      // prevent input
      return true;
    }
    return false;
  };

  const handlePaste = (event: ClipboardEvent) => {
    const length = vEditor.yText.length;
    const restLength = maxLength - length;
    if (restLength <= 0) return;

    const data = event.clipboardData?.getData('text/plain');
    if (!data) return;

    const vRange = vEditor.getVRange();
    const text = data.length > restLength ? data.slice(0, restLength) : data;
    if (vRange) {
      vEditor.insertText(vRange, text);
      vEditor.setVRange({
        index: vRange.index + text.length,
        length: 0,
      });
    }
  };

  const handleCompositionEnd = (event: CompositionEvent) => {
    const { data } = event;
    const currentText = vEditor.yText.toString();
    const vRange = vEditor.getVRange();
    const length = data.length + currentText.length;
    if (vRange && vRange.index >= 0 && data && length > maxLength) {
      // Separate by vRange:
      // 1. leftText: the text before vRange
      // 2. rightText: the text after vRange
      const leftText = currentText.slice(0, vRange.index);
      const rightText = currentText.slice(vRange.index);
      const enteredText = data.slice(0, maxLength - currentText.length);
      const [text] = vEditor.getTextPoint(vRange.index);
      if (text.textContent && text.textContent !== currentText) {
        text.textContent = `${leftText}${enteredText}${rightText}`;
        if (enteredText !== '') {
          vEditor.insertText(vRange, enteredText);
        }
        vEditor.setVRange({
          index: leftText.length + enteredText.length,
          length: 0,
        });
        return true;
      }
    }
    return false;
  };

  const vEditor = new VEditor(yText, options);
  setupVirgoScroll(targetModel.page, vEditor);
  vEditor.mount(container);
  vEditor.bindHandlers({
    virgoInput: handleInput,
    paste: handlePaste,
    virgoCompositionEnd: handleCompositionEnd,
    ...handlers,
  });
  vEditor.setReadonly(targetModel.page.readonly);

  return vEditor;
}
