import { IS_IOS, IS_MAC } from '@blocksuite/global/config';

import type { VRange } from '../types.js';
import type { VEditor } from '../virgo.js';

const SHORT_KEY_PROPERTY = IS_IOS || IS_MAC ? 'metaKey' : 'ctrlKey';

export const VKEYBOARD_PREVENT_DEFAULT = false;
export const VKEYBOARD_ALLOW_DEFAULT = true;

export interface VKeyboardBinding {
  key: number | string | string[];
  handler: VKeyboardBindingHandler;
  prefix?: RegExp;
  suffix?: RegExp;
  shortKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
}
export type VKeyboardBindingRecord = Record<string, VKeyboardBinding>;

export interface VKeyboardBindingContext {
  vRange: VRange;
  vEditor: VEditor;
  collapsed: boolean;
  prefixText: string;
  suffixText: string;
  raw: KeyboardEvent;
}
export type VKeyboardBindingHandler = (
  context: VKeyboardBindingContext
) => typeof VKEYBOARD_PREVENT_DEFAULT | typeof VKEYBOARD_ALLOW_DEFAULT;

export function createVirgoKeyDownHandler(
  vEditor: VEditor,
  bindings: VKeyboardBindingRecord
): (evt: KeyboardEvent) => void {
  const bindingStore: Record<string, VKeyboardBinding[]> = {};

  function normalize(binding: VKeyboardBinding): VKeyboardBinding {
    if (binding.shortKey) {
      binding[SHORT_KEY_PROPERTY] = binding.shortKey;
      delete binding.shortKey;
    }
    return binding;
  }

  function keyMatch(evt: KeyboardEvent, binding: VKeyboardBinding) {
    if (
      (['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const).some(
        key => Object.hasOwn(binding, key) && binding[key] !== evt[key]
      )
    ) {
      return false;
    }
    return binding.key === evt.key;
  }

  function addBinding(keyBinding: VKeyboardBinding) {
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
    const keyBindings = bindingStore[evt.key] ?? [];

    const keyMatches = keyBindings.filter(binding => keyMatch(evt, binding));
    if (keyMatches.length === 0) return;

    const vRange = vEditor.getVRange();
    if (!vRange) return;

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
    const currContext: VKeyboardBindingContext = {
      vRange,
      vEditor,
      collapsed: vRange.length === 0,
      prefixText,
      suffixText,
      raw: evt,
    };
    const prevented = keyMatches.some(binding => {
      if (binding.prefix && !binding.prefix.test(currContext.prefixText)) {
        return false;
      }
      if (binding.suffix && !binding.suffix.test(currContext.suffixText)) {
        return false;
      }
      return binding.handler(currContext) === VKEYBOARD_PREVENT_DEFAULT;
    });
    if (prevented) {
      evt.preventDefault();
    }
  }

  return keyDownHandler;
}
