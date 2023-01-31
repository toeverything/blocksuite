import type { BaseBlockModel, Page } from '@blocksuite/store';
import type { Quill, RangeStatic } from 'quill';
import {
  getCurrentRange,
  getNextBlock,
  isCollapsedAtBlockStart,
  isMultiBlockRange,
  noop,
} from '../utils/index.js';
import {
  handleLineStartBackspace,
  handleUnindent,
  handleBlockEndEnter,
  handleBlockSplit,
  handleSoftEnter,
  handleIndent,
  handleKeyDown,
  handleKeyUp,
  tryMatchSpaceHotkey,
} from './rich-text-operations.js';
import { Shortcuts } from './shortcuts.js';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import { showSlashMenu } from '../../components/slash-menu/index.js';
import { ALLOW_DEFAULT, PREVENT_DEFAULT } from '@blocksuite/global/config';

interface QuillRange {
  index: number;
  length: number;
}

interface BindingContext {
  collapsed: boolean;
  empty: boolean;
  offset: number;
  prefix: string;
  suffix: string;
  format: Record<string, unknown>;
}

type KeyboardBindings = Record<
  string,
  {
    key: string | number;
    handler: KeyboardBindingHandler;
    prefix?: RegExp;
    suffix?: RegExp;
    shortKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    ctrlKey?: boolean;
  }
>;

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
    Shortcuts.match(this.quill, model, prefix);
    return ALLOW_DEFAULT;
  }

  function spaceMarkdownMatch(
    this: KeyboardEventThis,
    range: QuillRange,
    context: BindingContext
  ) {
    const { prefix } = context;
    return Shortcuts.match(this.quill, model, prefix)
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

  function onIndent(this: KeyboardEventThis) {
    const index = this.quill.getSelection()?.index;
    handleIndent(page, model, index);
    return PREVENT_DEFAULT;
  }

  function onUnindent(this: KeyboardEventThis) {
    const index = this.quill.getSelection()?.index;
    handleUnindent(page, model, index);
    return PREVENT_DEFAULT;
  }

  function onKeyUp(this: KeyboardEventThis, range: QuillRange) {
    // return PREVENT_DEFAULT;
    if (range.index >= 0) {
      return handleKeyUp(model, this.quill.root);
    }
    return ALLOW_DEFAULT;
  }

  function onKeyDown(this: KeyboardEventThis, range: QuillRange) {
    if (range.index >= 0) {
      return handleKeyDown(model, this.quill.root);
    }
    return ALLOW_DEFAULT;
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
      const nextBlock = getNextBlock(model.id);
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

  function onBackspace(this: KeyboardEventThis) {
    // To workaround uncontrolled behavior when deleting character at block start,
    // in this case backspace should be handled in quill.
    if (isCollapsedAtBlockStart(this.quill)) {
      // window.requestAnimationFrame(() => {
      handleLineStartBackspace(page, model);
      // });
      return PREVENT_DEFAULT;
    } else if (isMultiBlockRange(getCurrentRange())) {
      // return PREVENT_DEFAULT;
      noop();
    }
    return ALLOW_DEFAULT;
  }

  const keyboardBindings: KeyboardBindings = {
    // Note: Since Quill’s default handlers are added at initialization,
    // the only way to prevent them is to add yours in the configuration.
    // See https://quilljs.com/docs/modules/keyboard/#configuration
    // The defaultOptions can found at https://github.com/quilljs/quill/blob/6159f6480482dde0530920dc41033ebc6611a9e7/modules/keyboard.ts#L334-L607
    'code exit': {
      key: 'enter',
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
      key: 'enter',
      handler: enterMarkdownMatch,
    },
    spaceMarkdownMatch: {
      key: ' ',
      handler: spaceMarkdownMatch,
    },
    hardEnter: {
      key: 'enter',
      handler() {
        return hardEnter(this.quill);
      },
    },
    softEnter: {
      key: 'enter',
      shiftKey: true,
      handler() {
        return onSoftEnter(this.quill);
      },
    },
    // shortKey+enter
    insertLineAfter: {
      key: 'enter',
      shortKey: true,
      handler() {
        return hardEnter(this.quill, true);
      },
    },
    tab: {
      key: 'tab',
      handler: onIndent,
    },
    shiftTab: {
      key: 'tab',
      shiftKey: true,
      handler: onUnindent,
    },
    // https://github.com/quilljs/quill/blob/v1.3.7/modules/keyboard.js#L249-L282
    'list autofill': {
      key: ' ',
      shiftKey: false,
      prefix: /^(\d+\.|-|\*|\[ ?\]|\[x\]|(#){1,6}|(-){3}|(\*){3}|>)$/,
      handler: onSpace,
    },
    'list autofill shift': {
      key: ' ',
      shiftKey: true,
      prefix: /^(\d+\.|-|\*|\[ ?\]|\[x\]|(#){1,6}|(-){3}|(\*){3}|>)$/,
      handler: onSpace,
    },
    backspace: {
      key: 'backspace',
      handler: onBackspace,
    },
    up: {
      key: 'up',
      shiftKey: false,
      handler: onKeyUp,
    },
    down: {
      key: 'down',
      shiftKey: false,
      handler: onKeyDown,
    },
    left: {
      key: 'left',
      shiftKey: false,
      handler: onKeyLeft,
    },
    right: {
      key: 'right',
      shiftKey: false,
      handler: onKeyRight,
    },

    slash: {
      // Slash '/'
      key: 191,
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
          const curRange = getCurrentRange();
          showSlashMenu({ model, range: curRange });
        });
        return ALLOW_DEFAULT;
      },
    },
  };

  return keyboardBindings;
}
