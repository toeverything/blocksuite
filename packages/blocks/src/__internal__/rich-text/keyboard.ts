import { IS_IOS, IS_MAC } from '@blocksuite/global/config';
import type { BaseBlockModel } from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';

import {
  getCurrentNativeRange,
  hasNativeSelection,
  matchFlavours,
} from '../utils/index.js';
import { createBracketAutoCompleteBindings } from './bracket-complete.js';
import { createRichTextKeymap } from './keymap/index.js';
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
  const blockKeyBinding = createRichTextKeymap(model, vEditor);

  const keyboardBindings: KeyboardBindings = {
    ...blockKeyBinding,
    ...createBracketAutoCompleteBindings(
      model,
      model.flavour === 'affine:code'
    ),
  };

  return keyboardBindings;
}

const SHORT_KEY_PROPERTY = IS_IOS || IS_MAC ? 'metaKey' : 'ctrlKey';

export function createKeyDownHandler(
  vEditor: AffineVEditor,
  bindings: KeyboardBindings,
  model: BaseBlockModel
): (evt: KeyboardEvent) => void {
  const bindingStore: Record<string, KeyboardBinding[]> = {};
  function normalize(binding: KeyboardBinding): KeyboardBinding {
    if (binding.shortKey) {
      binding[SHORT_KEY_PROPERTY] = binding.shortKey;
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
    const parentModel = model.page.getParent(model);
    const previousModel = model.page.getPreviousSibling(model);
    if (
      (parentModel && matchFlavours(parentModel, ['affine:database'])) ||
      (previousModel && matchFlavours(previousModel, ['affine:database']))
    ) {
      if (evt.key === 'Tab') {
        evt.preventDefault();
        evt.stopPropagation();
        return;
      }
    }

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
