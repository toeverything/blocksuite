import { ALLOW_DEFAULT, PREVENT_DEFAULT } from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import type { Quill, RangeStatic } from 'quill';

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

  function hardEnter(
    e: KeyboardEvent,
    range: QuillRange,
    /**
     * @deprecated
     */
    quill: Quill,
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
        onSoftEnter(range, quill);
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
      onSoftEnter(range, quill);
      return PREVENT_DEFAULT;
    }

    handleBlockSplit(page, model, range.index, range.length);
    return PREVENT_DEFAULT;
  }

  function onSoftEnter(
    range: QuillRange,
    /**
     * @deprecated
     */
    quill: Quill
  ) {
    handleSoftEnter(page, model, range.index, range.length);
    quill.setSelection(range.index + 1, 0);
    return PREVENT_DEFAULT;
  }

  function onTab(e: KeyboardEvent, range: QuillRange) {
    if (matchFlavours(model, ['affine:code'] as const)) {
      e.stopPropagation();
      return ALLOW_DEFAULT;
    }
    const index = range.index;
    handleIndent(page, model, index);
    e.stopPropagation();
    return PREVENT_DEFAULT;
  }

  function onShiftTab(e: KeyboardEvent, range: QuillRange) {
    if (matchFlavours(model, ['affine:code'] as const)) {
      e.stopPropagation();
      return ALLOW_DEFAULT;
    }
    const index = range.index;
    handleUnindent(page, model, index);
    e.stopPropagation();
    return PREVENT_DEFAULT;
  }

  function onKeyLeft(e: KeyboardEvent, range: QuillRange) {
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

  function onKeyRight(e: KeyboardEvent, range: QuillRange) {
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
    range: QuillRange,
    context: BindingContext
  ) {
    const { quill } = this;
    const { prefix } = context;
    return tryMatchSpaceHotkey(page, model, quill, prefix, range);
  }

  function onBackspace(e: KeyboardEvent, quill: Quill) {
    e.stopPropagation();
    if (isCollapsedAtBlockStart(quill)) {
      handleLineStartBackspace(page, model);
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
      handler(range, context) {
        return hardEnter(context.event, range, this.quill);
      },
    },
    softEnter: {
      key: 'Enter',
      shiftKey: true,
      handler(range, context) {
        return onSoftEnter(range, this.quill);
      },
    },
    // shortKey+enter
    insertLineAfter: {
      key: 'Enter',
      shortKey: true,
      handler(range, context) {
        return hardEnter(context.event, range, this.quill, true);
      },
    },
    tab: {
      key: 'Tab',
      handler(range, context) {
        return onTab(context.event, range);
      },
    },
    shiftTab: {
      key: 'Tab',
      shiftKey: true,
      handler(range, context) {
        return onShiftTab(context.event, range);
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
        return onBackspace(context.event, this.quill);
      },
    },
    up: {
      key: 'ArrowUp',
      shiftKey: false,
      handler(range, context) {
        return handleKeyUp(context.event, this.quill.root);
      },
    },
    down: {
      key: 'ArrowDown',
      shiftKey: false,
      handler(range, context) {
        return handleKeyDown(context.event, this.quill.root);
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
