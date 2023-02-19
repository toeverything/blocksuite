// This file should be sync with quill keyboard module between v1.3.7 and v2
// PLEASE DO NOT MODIFY THIS FILE UNLESS YOU KNOW WHAT YOU ARE DOING
import { isEqual } from '@blocksuite/global/utils';
import Quill from 'quill';

const Keyboard = Quill.import('modules/keyboard');
const TextBlot = Quill.import('blots/text');

export class KeyboardWithEvent extends Keyboard {
  // Use `KeyboardEvent.key` instead of `KeyboardEvent.keyCode`
  // See https://github.com/quilljs/quill/issues/1975
  // See https://github.com/quilljs/quill/pull/1438
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static match(evt: KeyboardEvent, binding: any) {
    if (
      (['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const).some(key => {
        return !!binding[key] !== evt[key] && binding[key] !== null;
      })
    ) {
      return false;
    }
    return binding.key === evt.key || binding.key === evt.which;
  }

  // Remove the legacy `normalize` function,
  // Avoid the binding key to be normalized to keyCode
  // See https://github.com/quilljs/quill/blob/d2f689fb4744cdada96c632a8bccf6d476932d7b/modules/keyboard.ts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addBinding(keyBinding: any, context: any, handler: any) {
    const binding = normalize(keyBinding);
    if (binding == null) {
      console.warn('Attempted to add invalid keyboard binding', binding);
      return;
    }
    if (typeof context === 'function') {
      context = { handler: context };
    }
    if (typeof handler === 'function') {
      handler = { handler };
    }
    const keys = Array.isArray(binding.key) ? binding.key : [binding.key];
    keys.forEach((key: unknown) => {
      const singleBinding = {
        ...binding,
        key,
        ...context,
        ...handler,
      };
      this.bindings[singleBinding.key] = this.bindings[singleBinding.key] || [];
      this.bindings[singleBinding.key].push(singleBinding);
    });
  }

  // Patch: add keyboard event to context for quill 1.3.7
  // See https://github.com/quilljs/quill/commit/90269c7af9fc03e46be257490b2b0aec85d9ecc7
  // Reference to https://github.com/quilljs/quill/blob/develop/modules/keyboard.ts
  listen() {
    this.quill.root.addEventListener('keydown', (evt: KeyboardEvent) => {
      if (evt.defaultPrevented || evt.isComposing) return;
      const bindings = (this.bindings[evt.key] || []).concat(
        this.bindings[evt.which] || []
      );
      const matches = bindings.filter((binding: unknown) =>
        KeyboardWithEvent.match(evt, binding)
      );
      if (matches.length === 0) return;
      // @ts-expect-error
      const blot = Quill.find(evt.target, true);
      if (blot && blot.scroll !== this.quill.scroll) return;
      const range = this.quill.getSelection();
      if (range == null || !this.quill.hasFocus()) return;
      const [line, offset] = this.quill.getLine(range.index);
      const [leafStart, offsetStart] = this.quill.getLeaf(range.index);
      const [leafEnd, offsetEnd] =
        range.length === 0
          ? [leafStart, offsetStart]
          : this.quill.getLeaf(range.index + range.length);
      const prefixText =
        leafStart instanceof TextBlot
          ? leafStart.value().slice(0, offsetStart)
          : '';
      const suffixText =
        leafEnd instanceof TextBlot ? leafEnd.value().slice(offsetEnd) : '';
      const curContext = {
        collapsed: range.length === 0,
        empty: range.length === 0 && line.length() <= 1,
        format: this.quill.getFormat(range),
        line,
        offset,
        prefix: prefixText,
        suffix: suffixText,
        event: evt,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prevented = matches.some((binding: any) => {
        if (
          binding.collapsed != null &&
          binding.collapsed !== curContext.collapsed
        ) {
          return false;
        }
        if (binding.empty != null && binding.empty !== curContext.empty) {
          return false;
        }
        if (binding.offset != null && binding.offset !== curContext.offset) {
          return false;
        }
        if (Array.isArray(binding.format)) {
          // any format is present
          if (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            binding.format.every((name: any) => curContext.format[name] == null)
          ) {
            return false;
          }
        } else if (typeof binding.format === 'object') {
          // all formats must match
          if (
            !Object.keys(binding.format).every(name => {
              if (binding.format[name] === true)
                return curContext.format[name] != null;
              if (binding.format[name] === false)
                return curContext.format[name] == null;
              return isEqual(binding.format[name], curContext.format[name]);
            })
          ) {
            return false;
          }
        }
        if (binding.prefix != null && !binding.prefix.test(curContext.prefix)) {
          return false;
        }
        if (binding.suffix != null && !binding.suffix.test(curContext.suffix)) {
          return false;
        }
        return binding.handler.call(this, range, curContext, binding) !== true;
      });
      if (prevented) {
        evt.preventDefault();
      }
    });
  }
}

const SHORTKEY = /Mac/i.test(navigator.platform) ? 'metaKey' : 'ctrlKey';

// See https://github.com/quilljs/quill/blob/d2f689fb4744cdada96c632a8bccf6d476932d7b/modules/keyboard.ts#L757-L774
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(binding: any): any {
  if (typeof binding === 'string' || typeof binding === 'number') {
    binding = { key: binding };
  } else if (typeof binding === 'object') {
    binding = { ...binding };

    // XXX It will break keyboard bindings for 'Z' and 'Y'
    // Patch https://github.com/quilljs/quill/blob/0148738cb22d52808f35873adb620ca56b1ae061/modules/history.js#L20-L25
    if (['Z', 'Y'].includes(binding.key)) {
      binding.key = binding.key.toLowerCase();
    }
    // End patch
  } else {
    return null;
  }
  if (binding.shortKey) {
    binding[SHORTKEY] = binding.shortKey;
    delete binding.shortKey;
  }
  return binding;
}
