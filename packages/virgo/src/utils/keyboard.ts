import { IS_IOS, IS_MAC } from '@blocksuite/global/config';

import type { VRange } from '../types.js';
import type { VEditor } from '../virgo.js';

const SHORT_KEY_PROPERTY = IS_IOS || IS_MAC ? 'metaKey' : 'ctrlKey';

interface KeyboardBinding {
  key: number | string | string[];
  handler: KeyboardBindingHandler;
  prefix?: RegExp;
  suffix?: RegExp;
  shortKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
}
type KeyboardBindingRecord = Record<string, KeyboardBinding>;

interface KeyboardBindingContext {
  vRange: VRange;
  vEditor: VEditor;
  collapsed: boolean;
  prefixText: string;
  suffixText: string;
  raw: KeyboardEvent;
}
type KeyboardBindingHandler = (context: KeyboardBindingContext) => boolean;

export function createKeyDownHandler(
  vEditor: VEditor,
  bindings: KeyboardBindingRecord
): (evt: KeyboardEvent) => void {
  const bindingStore: Record<string, KeyboardBinding[]> = {};

  function normalize(binding: KeyboardBinding): KeyboardBinding {
    if (binding.shortKey) {
      binding[SHORT_KEY_PROPERTY] = binding.shortKey;
      delete binding.shortKey;
    }
    return binding;
  }

  function keyMatch(evt: KeyboardEvent, binding: KeyboardBinding) {
    if (
      (['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const).some(
        key => Object.hasOwn(binding, key) && binding[key] !== evt[key]
      )
    ) {
      return false;
    }
    return binding.key === evt.key;
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
    const currContext: KeyboardBindingContext = {
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
      return binding.handler(currContext);
    });
    if (prevented) {
      evt.preventDefault();
    }
  }

  return keyDownHandler;
}
