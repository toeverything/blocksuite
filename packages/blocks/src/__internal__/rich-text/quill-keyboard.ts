import Quill from 'quill';
import { isEqual } from '@blocksuite/global/utils';

const Keyboard = Quill.import('modules/keyboard');
const TextBlot = Quill.import('blots/text');

// Patch keyboard event to context for quill 1.3.7
// See https://github.com/quilljs/quill/commit/90269c7af9fc03e46be257490b2b0aec85d9ecc7
// Reference to https://github.com/quilljs/quill/blob/develop/modules/keyboard.ts
export class KeyboardWithEvent extends Keyboard {
  listen() {
    this.quill.root.addEventListener('keydown', (evt: KeyboardEvent) => {
      if (evt.defaultPrevented || evt.isComposing) return;
      const bindings = (this.bindings[evt.key] || []).concat(
        this.bindings[evt.which] || []
      );
      const matches = bindings.filter((binding: unknown) =>
        Keyboard.match(evt, binding)
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
