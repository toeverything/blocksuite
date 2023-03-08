import { ALLOW_DEFAULT, PREVENT_DEFAULT } from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';

import { showSlashMenu } from '../../components/slash-menu/index.js';
import {
  getCurrentNativeRange,
  isCollapsedAtBlockStart,
} from '../utils/index.js';
import { createBracketAutoCompleteBindings } from './bracket-complete.js';
import { markdownConvert, tryMatchSpaceHotkey } from './markdown-convert.js';
import {
  handleBlockEndEnter,
  handleBlockSplit,
  handleIndent,
  handleKeyDown,
  handleKeyUp,
  handleLineStartBackspace,
  handleSoftEnter,
  handleUnindent,
} from './rich-text-operations.js';
import type { AffineVEditor } from './virgo/types.js';

// Type definitions is ported from quill
// https://github.com/quilljs/quill/blob/6159f6480482dde0530920dc41033ebc6611a9e7/modules/keyboard.ts#L15-L46

interface BindingContext {
  collapsed: boolean;
  empty: boolean;
  offset: number;
  prefix: string;
  suffix: string;
  format: Record<string, unknown>;
  event: KeyboardEvent;
}

type KeyboardBinding = {
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

const IS_SAFARI = /Apple Computer/.test(navigator.vendor);
const IS_IOS =
  IS_SAFARI &&
  (/Mobile\/\w+/.test(navigator.userAgent) || navigator.maxTouchPoints > 2);
const IS_MAC = /Mac/i.test(navigator.platform);

// If a block is soft enterable, the rule is:
// 1. In the end of block, first press Enter will insert a \n to break the line, second press Enter will insert a new block
// 2. In the middle and start of block, press Enter will insert a \n to break the line
// TODO this should be configurable per-block
function isSoftEnterable(model: BaseBlockModel) {
  if (matchFlavours(model, ['affine:code'] as const)) return true;
  if (matchFlavours(model, ['affine:paragraph'] as const)) {
    return model.type === 'quote';
  }
  return false;
}

export function createKeyboardBindings(
  page: Page,
  model: BaseBlockModel
): KeyboardBindings {
  function enterMarkdownMatch(
    this: KeyboardEventThis,
    range: VRange,
    context: BindingContext
  ) {
    const { prefix } = context;
    markdownConvert(this.vEditor, model, prefix);
    return ALLOW_DEFAULT;
  }

  function spaceMarkdownMatch(
    this: KeyboardEventThis,
    range: VRange,
    context: BindingContext
  ) {
    const { prefix } = context;
    return markdownConvert(this.vEditor, model, prefix)
      ? PREVENT_DEFAULT
      : ALLOW_DEFAULT;
  }

  function hardEnter(
    e: KeyboardEvent,
    range: VRange,
    /**
     * @deprecated
     */
    vEditor: AffineVEditor,
    shortKey = false
  ) {
    e.stopPropagation();
    const parent = page.getParent(model);
    const isLastChild = parent?.lastChild() === model;
    const isEmptyList =
      matchFlavours(model, ['affine:list'] as const) && model.text.length === 0;

    assertExists(model.text, 'Failed to hardEnter! model.text not exists!');

    if (
      isEmptyList &&
      parent &&
      matchFlavours(parent, ['affine:frame'] as const) &&
      model.children.length === 0
    ) {
      // TODO use `handleLineStartBackspace` directly is not concise enough,
      // we should extract a function to handle this case
      //
      // Before
      // - list
      // - | <-- press Enter
      //
      // After
      // - list
      // |   <-- will replace with a new text block
      handleLineStartBackspace(page, model);
      return PREVENT_DEFAULT;
    }
    if (isEmptyList && isLastChild) {
      // Before
      // - line1
      //   - ↩ <-- press Enter
      //
      // After
      // - line1
      // - | <-- will unindent the block
      handleUnindent(page, model, range.index);
      return PREVENT_DEFAULT;
    }

    const isEnd = model.text.length === range.index;
    if (isEnd || shortKey) {
      const softEnterable = isSoftEnterable(model);
      const textStr = model.text.toString();
      const endWithTwoBlankLines = textStr === '\n' || textStr.endsWith('\n\n');
      const shouldSoftEnter = softEnterable && !endWithTwoBlankLines;

      if (shouldSoftEnter) {
        // TODO handle ctrl+enter in code/quote block or other force soft enter block
        onSoftEnter(range, vEditor);
        return PREVENT_DEFAULT;
      }

      // delete the \n at the end of block
      if (softEnterable) {
        // Before
        // >
        // > ↩ <-- press Enter
        //
        // After
        // - line1
        // - | <-- will unindent the block
        model.text.delete(range.index - 1, 1);
      }
      handleBlockEndEnter(page, model);
      return PREVENT_DEFAULT;
    }

    const isSoftEnterBlock = isSoftEnterable(model);
    if (isSoftEnterBlock) {
      onSoftEnter(range, vEditor);
      return PREVENT_DEFAULT;
    }

    handleBlockSplit(page, model, range.index, range.length);
    return PREVENT_DEFAULT;
  }

  function onSoftEnter(
    range: VRange,
    /**
     * @deprecated
     */
    vEditor: AffineVEditor
  ) {
    handleSoftEnter(page, model, range.index, range.length);
    vEditor.setVRange({
      index: range.index + 1,
      length: 0,
    });
    return PREVENT_DEFAULT;
  }

  function onTab(this: KeyboardEventThis, e: KeyboardEvent, vRange: VRange) {
    if (matchFlavours(model, ['affine:code'] as const)) {
      e.stopPropagation();

      const lineStart =
        this.vEditor.yText.toString().lastIndexOf('\n', vRange.index) !== -1
          ? this.vEditor.yText.toString().lastIndexOf('\n', vRange.index) + 1
          : 0;
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

      const lineStart =
        this.vEditor.yText.toString().lastIndexOf('\n', vRange.index) !== -1
          ? this.vEditor.yText.toString().lastIndexOf('\n', vRange.index) + 1
          : 0;
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

  function onKeyLeft(e: KeyboardEvent, range: VRange) {
    // range.length === 0 means collapsed selection
    if (range.length !== 0) {
      e.stopPropagation();
      return ALLOW_DEFAULT;
    }
    const lineStart = range.index === 0;
    if (!lineStart) {
      e.stopPropagation();
      return ALLOW_DEFAULT;
    }
    // Need jump to previous block
    return PREVENT_DEFAULT;
  }

  function onKeyRight(e: KeyboardEvent, range: VRange) {
    if (range.length !== 0) {
      e.stopPropagation();
      return ALLOW_DEFAULT;
    }
    assertExists(model.text, 'Failed to onKeyRight! model.text not exists!');
    const textLength = model.text.length;
    const lineEnd = textLength === range.index;
    if (!lineEnd) {
      e.stopPropagation();
      return ALLOW_DEFAULT;
    }
    // Need jump to next block
    return PREVENT_DEFAULT;
  }

  function onSpace(
    this: KeyboardEventThis,
    range: VRange,
    context: BindingContext
  ) {
    const { vEditor } = this;
    const { prefix } = context;
    return tryMatchSpaceHotkey(page, model, vEditor, prefix, range);
  }

  function onBackspace(e: KeyboardEvent, vEditor: AffineVEditor) {
    e.stopPropagation();
    if (isCollapsedAtBlockStart(vEditor)) {
      handleLineStartBackspace(page, model);
      return PREVENT_DEFAULT;
    }
    return ALLOW_DEFAULT;
  }

  const keyboardBindings: KeyboardBindings = {
    // Note: Since quill's default handlers are added at initialization,
    // the only way to prevent them is to add yours in the configuration.
    // See https://quilljs.com/docs/modules/keyboard/#configuration
    // The defaultOptions can found at https://github.com/quilljs/quill/blob/6159f6480482dde0530920dc41033ebc6611a9e7/modules/keyboard.ts#L334-L607
    'code exit': {
      key: 'Enter',
      // override default behavior
      handler: () => ALLOW_DEFAULT,
    },
    bold: {
      key: 'b',
      shortKey: true,
      handler: () => ALLOW_DEFAULT,
    },
    italic: {
      key: 'i',
      shortKey: true,
      handler: () => ALLOW_DEFAULT,
    },
    underline: {
      key: 'u',
      shortKey: true,
      handler: () => ALLOW_DEFAULT,
    },

    enterMarkdownMatch: {
      key: 'Enter',
      handler: enterMarkdownMatch,
    },
    hardEnter: {
      key: 'Enter',
      handler(range, context) {
        return hardEnter(context.event, range, this.vEditor);
      },
    },
    softEnter: {
      key: 'Enter',
      shiftKey: true,
      handler(range, context) {
        return onSoftEnter(range, this.vEditor);
      },
    },
    // shortKey+enter
    insertLineAfter: {
      key: 'Enter',
      shortKey: true,
      handler(range, context) {
        return hardEnter(context.event, range, this.vEditor, true);
      },
    },
    tab: {
      key: 'Tab',
      handler(range, context) {
        return onTab.call(this, context.event, range);
      },
    },
    shiftTab: {
      key: 'Tab',
      shiftKey: true,
      handler(range, context) {
        return onShiftTab.call(this, context.event, range);
      },
    },
    spaceMarkdownMatch: {
      key: ' ',
      handler: spaceMarkdownMatch,
    },
    // https://github.com/quilljs/quill/blob/v1.3.7/modules/keyboard.js#L249-L282
    'list autofill': {
      key: ' ',
      shiftKey: null,
      prefix: /^(\d+\.|-|\*|\[ ?\]|\[x\]|(#){1,6}|(-){3}|(\*){3}|>)$/,
      handler: onSpace,
    },
    backspace: {
      key: 'Backspace',
      handler(range, context) {
        return onBackspace(context.event, this.vEditor);
      },
    },
    up: {
      key: 'ArrowUp',
      shiftKey: false,
      handler(range, context) {
        return handleKeyUp(context.event, this.vEditor.rootElement);
      },
    },
    down: {
      key: 'ArrowDown',
      shiftKey: false,
      handler(range, context) {
        return handleKeyDown(context.event, this.vEditor.rootElement);
      },
    },
    left: {
      key: 'ArrowLeft',
      shiftKey: false,
      handler(range, context) {
        return onKeyLeft(context.event, range);
      },
    },
    right: {
      key: 'ArrowRight',
      shiftKey: false,
      handler(range, context) {
        return onKeyRight(context.event, range);
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

        if (matchFlavours(model, ['affine:code'] as const)) {
          return ALLOW_DEFAULT;
        }
        // if (context.format['code'] === true) {
        //   return ALLOW_DEFAULT;
        // }

        // we need to insert text before show menu, because the Text node will be
        // expired if we insert text after show menu because of the re-render
        this.vEditor.insertText(range, context.event.key);
        this.vEditor.setVRange({
          index: range.index + 1,
          length: 0,
        });

        requestAnimationFrame(() => {
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

  const SHORTKEY = IS_IOS || IS_MAC ? 'metaKey' : 'ctrlKey';

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
      return (
        binding.handler.call(
          {
            vEditor,
            options: {
              bindings,
            },
          },
          vRange,
          curContext
        ) !== true
      );
    });
    if (prevented) {
      evt.preventDefault();
    }
  }

  return keyDownHandler;
}
