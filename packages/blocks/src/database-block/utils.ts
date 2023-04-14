import type { BaseBlockModel, Y } from '@blocksuite/store';
import type { VirgoEventService } from '@blocksuite/virgo';
import {
  type BaseTextAttributes,
  VEditor,
  type VEditorOptions,
} from '@blocksuite/virgo';

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
  event: 'click' | 'mousedown' = 'click',
  reusable = false
): () => void {
  const outsideClickListener = (event: Event) => {
    if (!element.contains(event.target as Node) && isVisible(element)) {
      // or use: event.target.closest(selector) === null
      callback(element);
      // if reuseable, need to manually remove the listener
      if (!reusable) removeClickListener();
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
  'var(--affine-tag-blue)',
  'var(--affine-tag-green)',
  'var(--affine-tag-teal)',
  'var(--affine-tag-white)',
  'var(--affine-tag-purple)',
  'var(--affine-tag-red)',
  'var(--affine-tag-pink)',
  'var(--affine-tag-yellow)',
  'var(--affine-tag-orange)',
  'var(--affine-tag-gray)',
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
  readonly?: boolean;
  handlers?: VirgoEventService<BaseTextAttributes>['_handlers'];
  options?: VEditorOptions;
};
export function initLimitedLengthVEditor({
  yText,
  container,
  targetModel,
  maxLength,
  readonly,
  handlers = {},
  options = {
    defaultMode: 'rich',
  },
}: InitLimitedLengthVEditorConfig) {
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

  const vEditor = new VEditor(yText, options);
  setupVirgoScroll(targetModel.page, vEditor);
  vEditor.mount(container);
  vEditor.bindHandlers({
    virgoInput: ctx => {
      const length = vEditor.yText.length;
      if (length >= maxLength && ctx.event.data) {
        // prevent input
        ctx.skipDefault = true;
      }
      return ctx;
    },
    paste: handlePaste,
    virgoCompositionEnd: ctx => {
      const { data } = ctx;
      const vRange = vEditor.getVRange();
      if (!data || !vRange || vRange.index < 0) return ctx;

      const currentText = vEditor.yText.toString();
      const length = data.length + currentText.length - vRange.length;
      if (length > maxLength) {
        const enteredText = data.slice(
          0,
          maxLength - currentText.length - vRange.length
        );
        ctx.data = enteredText;
      }
      return ctx;
    },
    ...handlers,
  });
  vEditor.setReadonly(
    readonly === undefined ? targetModel.page.readonly : readonly
  );

  return vEditor;
}
