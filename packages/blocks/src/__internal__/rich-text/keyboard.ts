import { ALLOW_DEFAULT, IS_IOS, IS_MAC } from '@blocksuite/global/config';
import { matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';

import { showLinkedPagePopover } from '../../components/linked-page/index.js';
import { showSlashMenu } from '../../components/slash-menu/index.js';
import { getService } from '../service.js';
import { getCurrentNativeRange, hasNativeSelection } from '../utils/index.js';
import { createBracketAutoCompleteBindings } from './bracket-complete.js';
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

  const service = getService(model.flavour);
  const blockKeyBinding = service.defineKeymap(model, vEditor);

  const keyboardBindings: KeyboardBindings = {
    ...blockKeyBinding,

    linkedPage: {
      key: ['[', '【', '@'],
      altKey: null,
      shiftKey: null,
      handler(range, { event, prefix }) {
        if (range.length > 0) {
          // When select text and press `[[` should not trigger transform,
          // since it will break the bracket complete.
          // Expected `[[selected text]]` instead of `@selected text]]`
          return ALLOW_DEFAULT;
        }
        if (
          (event.key === '[' || event.key === '【') &&
          !prefix.endsWith(event.key)
        ) {
          // not end with `[[` or `【【`
          return ALLOW_DEFAULT;
        }
        const flag = page.awarenessStore.getFlag('enable_linked_page');
        if (!flag) return ALLOW_DEFAULT;
        if (matchFlavours(model, ['affine:code'])) {
          return ALLOW_DEFAULT;
        }

        this.vEditor.slots.rangeUpdated.once(() => {
          if (event.key === '[' || event.key === '【') {
            // Convert to `@`
            this.vEditor.deleteText({ index: range.index - 1, length: 2 });
            this.vEditor.insertText({ index: range.index - 1, length: 0 }, '@');
            this.vEditor.setVRange({ index: range.index, length: 0 });
            this.vEditor.slots.rangeUpdated.once(() => {
              const curRange = getCurrentNativeRange();
              showLinkedPagePopover({ model, range: curRange });
            });
            return;
          }
          const curRange = getCurrentNativeRange();
          showLinkedPagePopover({ model, range: curRange });
        });
        return ALLOW_DEFAULT;
      },
    },

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

        if (matchFlavours(model, ['affine:code'])) {
          return ALLOW_DEFAULT;
        }
        // if (context.format['code'] === true) {
        //   return ALLOW_DEFAULT;
        // }
        this.vEditor.slots.rangeUpdated.once(() => {
          const curRange = getCurrentNativeRange();
          showSlashMenu({ model, range: curRange });
        });
        return ALLOW_DEFAULT;
      },
    },
    ...createBracketAutoCompleteBindings(model),
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
      evt.preventDefault();
      evt.stopPropagation();
      return;
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
