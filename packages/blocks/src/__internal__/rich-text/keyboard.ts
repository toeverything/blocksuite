import { ALLOW_DEFAULT, PREVENT_DEFAULT } from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import type { Quill, RangeStatic } from 'quill';

import { showSlashMenu } from '../../components/slash-menu/index.js';
import {
  getCurrentNativeRange,
  getNextBlock,
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

// Type definitions is ported from quill
// https://github.com/quilljs/quill/blob/6159f6480482dde0530920dc41033ebc6611a9e7/modules/keyboard.ts#L15-L46

type QuillRange = RangeStatic;

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

export type KeyboardBindings = Record<string, KeyboardBinding>;

interface KeyboardEventThis {
  quill: Quill;
  options: {
    bindings: KeyboardBindings;
  };
}

type KeyboardBindingHandler = (
  this: KeyboardEventThis,
  range: RangeStatic,
  context: BindingContext
) => boolean;

function isAtBlockEnd(quill: Quill) {
  return quill.getLength() - 1 === quill.getSelection(true)?.index;
}

// If a block is soft enterable, the rule is:
// 1. In the end of block, first press Enter will insert a \n to break the line, second press Enter will insert a new block
// 2. In the middle and start of block, press Enter will insert a \n to break the line
// TODO this should be configurable per-block
function isSoftEnterable(model: BaseBlockModel) {
  if (matchFlavours(model, ['affine:code'])) return true;
  if (matchFlavours(model, ['affine:paragraph'])) {
    return model.type === 'quote';
  }
  return false;
}

export function createKeyboardBindings(page: Page, model: BaseBlockModel) {
  function enterMarkdownMatch(
    this: KeyboardEventThis,
    range: QuillRange,
    context: BindingContext
  ) {
    const { prefix } = context;
    markdownConvert(this.quill, model, prefix);
    return ALLOW_DEFAULT;
  }

  function spaceMarkdownMatch(
    this: KeyboardEventThis,
    range: QuillRange,
    context: BindingContext
  ) {
    const { prefix } = context;
    return markdownConvert(this.quill, model, prefix)
      ? PREVENT_DEFAULT
      : ALLOW_DEFAULT;
  }

  function hardEnter(quill: Quill, shortKey = false) {
    const isEnd = isAtBlockEnd(quill);
    const parent = page.getParent(model);
    const isLastChild = parent?.lastChild() === model;
    const isEmptyList =
      matchFlavours(model, ['affine:list']) && model.text?.length === 0;
    const selection = quill.getSelection();
    assertExists(selection);

    if (
      isEmptyList &&
      parent &&
      matchFlavours(parent, ['affine:frame']) &&
      model.children.length === 0
    ) {
      handleLineStartBackspace(page, model);
    } else if (isEmptyList && isLastChild) {
      // Before
      // - line1
      //   - ↩ <-- press Enter
      //
      // After
      // - line1
      // - | <-- will unindent the block
      handleUnindent(page, model, selection.index);
    } else if (isEnd || shortKey) {
      const softEnterable = isSoftEnterable(model);

      const isNewLine = /\n\n$/.test(quill.getText());
      const shouldSoftEnter = softEnterable && !isNewLine;

      if (shouldSoftEnter) {
        // TODO handle ctrl+enter in code/quote block or other force soft enter block
        onSoftEnter(quill);
      } else {
        // delete the \n at the end of block
        if (softEnterable) {
          quill.deleteText(selection.index, 1);
        }
        handleBlockEndEnter(page, model);
      }
    } else {
      const isSoftEnterBlock = isSoftEnterable(model);

      if (isSoftEnterBlock) {
        onSoftEnter(quill);
      } else {
        handleBlockSplit(page, model, selection.index, selection.length);
      }
    }

    return PREVENT_DEFAULT;
  }

  function onSoftEnter(quill: Quill) {
    const selection = quill.getSelection();
    assertExists(selection);
    handleSoftEnter(page, model, selection.index, selection.length);
    quill.setSelection(selection.index + 1, 0);
    return PREVENT_DEFAULT;
  }

  function onTab(this: KeyboardEventThis) {
    if (matchFlavours(model, ['affine:code'])) {
      return ALLOW_DEFAULT;
    }
    const index = this.quill.getSelection()?.index;
    handleIndent(page, model, index);
    return PREVENT_DEFAULT;
  }

  function onShiftTab(this: KeyboardEventThis) {
    if (matchFlavours(model, ['affine:code'])) {
      return ALLOW_DEFAULT;
    }
    const index = this.quill.getSelection()?.index;
    handleUnindent(page, model, index);
    return PREVENT_DEFAULT;
  }

  function onKeyLeft(this: KeyboardEventThis, range: QuillRange) {
    // range.length === 0 means collapsed selection, if have range length, the cursor is in the start of text
    if (range.index === 0 && range.length === 0) {
      return PREVENT_DEFAULT;
    }

    return ALLOW_DEFAULT;
  }

  function onKeyRight(this: KeyboardEventThis, range: QuillRange) {
    const textLength = this.quill.getText().length;
    if (range.index + 1 === textLength) {
      const nextBlock = getNextBlock(model);
      if (!nextBlock) {
        return ALLOW_DEFAULT;
      }
      return PREVENT_DEFAULT;
    }
    return ALLOW_DEFAULT;
  }

  function onSpace(
    this: KeyboardEventThis,
    range: QuillRange,
    context: BindingContext
  ) {
    const { quill } = this;
    const { prefix } = context;
    return tryMatchSpaceHotkey(page, model, quill, prefix, range);
  }

  function onBackspace(e: KeyboardEvent, quill: Quill) {
    if (isCollapsedAtBlockStart(quill)) {
      handleLineStartBackspace(page, model);
      e.stopPropagation();
      return PREVENT_DEFAULT;
    }
    return ALLOW_DEFAULT;
  }

  const keyboardBindings: KeyboardBindings = {
    // Note: Since Quill’s default handlers are added at initialization,
    // the only way to prevent them is to add yours in the configuration.
    // See https://quilljs.com/docs/modules/keyboard/#configuration
    // The defaultOptions can found at https://github.com/quilljs/quill/blob/6159f6480482dde0530920dc41033ebc6611a9e7/modules/keyboard.ts#L334-L607
    'code exit': {
      key: 'Enter',
      // override default quill behavior
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
      handler() {
        return hardEnter(this.quill);
      },
    },
    softEnter: {
      key: 'Enter',
      shiftKey: true,
      handler() {
        return onSoftEnter(this.quill);
      },
    },
    // shortKey+enter
    insertLineAfter: {
      key: 'Enter',
      shortKey: true,
      handler() {
        return hardEnter(this.quill, true);
      },
    },
    tab: {
      key: 'Tab',
      handler: onTab,
    },
    shiftTab: {
      key: 'Tab',
      shiftKey: true,
      handler: onShiftTab,
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
      handler(
        this: KeyboardEventThis,
        range: QuillRange,
        context: BindingContext
      ) {
        return onBackspace(context.event, this.quill);
      },
    },
    up: {
      key: 'ArrowUp',
      shiftKey: false,
      handler(
        this: KeyboardEventThis,
        range: QuillRange,
        context: BindingContext
      ) {
        return handleKeyUp(context.event, this.quill.root);
      },
    },
    down: {
      key: 'ArrowDown',
      shiftKey: false,
      handler(
        this: KeyboardEventThis,
        range: QuillRange,
        context: BindingContext
      ) {
        return handleKeyDown(context.event, this.quill.root);
      },
    },
    left: {
      key: 'ArrowLeft',
      shiftKey: false,
      handler: onKeyLeft,
    },
    right: {
      key: 'ArrowRight',
      shiftKey: false,
      handler: onKeyRight,
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
        requestAnimationFrame(() => {
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
