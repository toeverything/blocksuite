import { ALLOW_DEFAULT, PREVENT_DEFAULT } from '@blocksuite/global/config';
import { matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';

import { showSlashMenu } from '../../components/slash-menu/index.js';
import { getService } from '../service.js';
import { getCurrentNativeRange, hasNativeSelection } from '../utils/index.js';
import { SHORTKEY } from '../utils/shortcut.js';
import { createBracketAutoCompleteBindings } from './bracket-complete.js';
import { handleIndent, handleUnindent } from './rich-text-operations.js';
import type { AffineVEditor } from './virgo/types.js';

// Type definitions is ported from quill
// https://github.com/quilljs/quill/blob/6159f6480482dde0530920dc41033ebc6611a9e7/modules/keyboard.ts#L15-L46

export interface BindingContext {
  collapsed: boolean;
  empty: boolean;
  offset: number;
  prefix: string;
  suffix: string;
  format: Record<string, unknown>;
  event: KeyboardEvent;
}

export type KeyboardBinding = {
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
   */
  key: number | string | string[];
  collapsed?: boolean;
  handler: KeyboardBindingHandler;
  prefix?: RegExp;
  suffix?: RegExp;
  shortKey?: boolean | null;
  shiftKey?: boolean | null;
  altKey?: boolean | null;
  metaKey?: boolean | null;
  ctrlKey?: boolean | null;
};

type KeyboardBindingHandler = (
  this: KeyboardEventThis,
  range: VRange,
  context: BindingContext
) => boolean;

export type KeyboardBindings = Record<string, KeyboardBinding>;

interface KeyboardEventThis {
  vEditor: AffineVEditor;
  options: {
    bindings: KeyboardBindings;
  };
}

export function createKeyboardBindings(
  model: BaseBlockModel,
  vEditor: AffineVEditor
): KeyboardBindings {
  const page = model.page;
  function onTab(this: KeyboardEventThis, e: KeyboardEvent, vRange: VRange) {
    if (matchFlavours(model, ['affine:code'] as const)) {
      e.stopPropagation();

      const lastLineBreakBeforeCursor = this.vEditor.yText
        .toString()
        .lastIndexOf('\n', vRange.index - 1);

      const lineStart =
        lastLineBreakBeforeCursor !== -1 ? lastLineBreakBeforeCursor + 1 : 0;
      this.vEditor.insertText(
        {
          index: lineStart,
          length: 0,
        },
        '  '
      );
      this.vEditor.setVRange({
        index: vRange.index + 2,
        length: 0,
      });

      return PREVENT_DEFAULT;
    }

    const index = vRange.index;
    handleIndent(page, model, index);
    e.stopPropagation();
    return PREVENT_DEFAULT;
  }

  function onShiftTab(
    this: KeyboardEventThis,
    e: KeyboardEvent,
    vRange: VRange
  ) {
    if (matchFlavours(model, ['affine:code'] as const)) {
      e.stopPropagation();

      const lastLineBreakBeforeCursor = this.vEditor.yText
        .toString()
        .lastIndexOf('\n', vRange.index - 1);

      const lineStart =
        lastLineBreakBeforeCursor !== -1 ? lastLineBreakBeforeCursor + 1 : 0;
      if (
        this.vEditor.yText.length >= 2 &&
        this.vEditor.yText.toString().slice(lineStart, lineStart + 2) === '  '
      ) {
        this.vEditor.deleteText({
          index: lineStart,
          length: 2,
        });
        this.vEditor.setVRange({
          index: vRange.index - 2,
          length: 0,
        });
      }

      return PREVENT_DEFAULT;
    }

    const index = vRange.index;
    handleUnindent(page, model, index);
    e.stopPropagation();
    return PREVENT_DEFAULT;
  }

  onTab;
  onShiftTab;

  const service = getService(model.flavour);
  const blockKeyBinding = service.defineKeymap(model, vEditor);

  const keyboardBindings: KeyboardBindings = {
    ...blockKeyBinding,

    slash: {
      key: [
        '/',
        // Compatible with CJK IME
        '、',
      ],
      shiftKey: null,
      // prefix non digit or empty string
      // see https://stackoverflow.com/questions/19127384/what-is-a-regex-to-match-only-an-empty-string
      // prefix: /[^\d]$|^(?![\s\S])/,
      handler(range, context) {
        // TODO remove feature flag after slash menu is stable
        const flag = page.awarenessStore.getFlag('enable_slash_menu');
        if (!flag) {
          return ALLOW_DEFAULT;
        }
        // End of feature flag

        if (matchFlavours(model, ['affine:code'] as const)) {
          return ALLOW_DEFAULT;
        }
        // if (context.format['code'] === true) {
        //   return ALLOW_DEFAULT;
        // }

        // we need to insert text before show menu, because the Text node will be
        // expired if we insert text after show menu because of the rerender
        this.vEditor.insertText(range, context.event.key);
        this.vEditor.setVRange({
          index: range.index + 1,
          length: 0,
        });

        this.vEditor.slots.rangeUpdated.once(() => {
          const curRange = getCurrentNativeRange();
          showSlashMenu({ model, range: curRange });
        });

        return PREVENT_DEFAULT;
      },
    },
    ...createBracketAutoCompleteBindings(model),
  };

  return keyboardBindings;
}

export function createKeyDownHandler(
  vEditor: AffineVEditor,
  bindings: KeyboardBindings
): (evt: KeyboardEvent) => void {
  const bindingStore: Record<string, KeyboardBinding[]> = {};
  function normalize(binding: KeyboardBinding): KeyboardBinding {
    if (binding.shortKey) {
      binding[SHORTKEY] = binding.shortKey;
      delete binding.shortKey;
    }
    return binding;
  }

  function match(evt: KeyboardEvent, binding: KeyboardBinding) {
    if (
      (['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const).some(key => {
        return !!binding[key] !== evt[key] && binding[key] !== null;
      })
    ) {
      return false;
    }
    return binding.key === evt.key || binding.key === evt.which;
  }

  function addBinding(keyBinding: KeyboardBinding) {
    const binding = normalize(keyBinding);
    const keys = Array.isArray(binding.key) ? binding.key : [binding.key];
    keys.forEach(key => {
      const singleBinding = {
        ...binding,
        key,
      };
      bindingStore[key] = bindingStore[key] ?? [];
      bindingStore[key].push(singleBinding);
    });
  }

  Object.values(bindings).forEach(binding => {
    addBinding(binding);
  });

  function keyDownHandler(evt: KeyboardEvent) {
    if (evt.defaultPrevented || evt.isComposing) return;
    const keyBindings = (bindingStore[evt.key] || []).concat(
      bindingStore[evt.which] || []
    );
    const matches = keyBindings.filter(binding => match(evt, binding));
    if (matches.length === 0) return;

    const vRange = vEditor.getVRange();
    if (!vRange) return;

    // edgeless mode
    if (!hasNativeSelection()) return;
    // if it is multi block selection, we should not handle the keydown event
    const range = getCurrentNativeRange();
    if (!range) return;
    if (
      !vEditor.rootElement.contains(range.startContainer) ||
      !vEditor.rootElement.contains(range.endContainer)
    ) {
      return;
    }

    const [line, offset] = vEditor.getLine(vRange.index);
    const [leafStart, offsetStart] = vEditor.getTextPoint(vRange.index);
    const [leafEnd, offsetEnd] =
      vRange.length === 0
        ? [leafStart, offsetStart]
        : vEditor.getTextPoint(vRange.index + vRange.length);
    const prefixText = leafStart.textContent
      ? leafStart.textContent.slice(0, offsetStart)
      : '';
    const suffixText = leafEnd.textContent
      ? leafEnd.textContent.slice(offsetEnd)
      : '';
    const curContext = {
      collapsed: vRange.length === 0,
      empty: vRange.length === 0 && line.textLength <= 1,
      format: vEditor.getFormat(vRange),
      line,
      offset,
      prefix: prefixText,
      suffix: suffixText,
      event: evt,
    };
    const prevented = matches.some(binding => {
      if (
        binding.collapsed != null &&
        binding.collapsed !== curContext.collapsed
      ) {
        return false;
      }
      if (binding.prefix != null && !binding.prefix.test(curContext.prefix)) {
        return false;
      }
      if (binding.suffix != null && !binding.suffix.test(curContext.suffix)) {
        return false;
      }
      return !binding.handler.call(
        {
          vEditor,
          options: {
            bindings,
          },
        },
        vRange,
        curContext
      );
    });
    if (prevented) {
      evt.preventDefault();
    }
  }

  return keyDownHandler;
}
