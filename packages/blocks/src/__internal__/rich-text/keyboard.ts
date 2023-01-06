import { showSlashMenu } from '../../components/slash-menu/index.js';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import type { Quill, RangeStatic } from 'quill';
import {
  ALLOW_DEFAULT,
  getCurrentRange,
  getNextBlock,
  isCollapsedAtBlockStart,
  isMultiBlockRange,
  matchFlavours,
  noop,
  PREVENT_DEFAULT,
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

  function hardEnter(this: KeyboardEventThis) {
    const isEnd = isAtBlockEnd(this.quill);
    const parent = page.getParent(model);
    const isLastChild = parent?.lastChild() === model;
    const isEmptyList =
      matchFlavours(model, ['affine:list']) && model.text?.length === 0;
    const index = this.quill.getSelection()?.index || 0;

    // Some block should treat Enter as soft enter
    // Logic is：
    // 1. In the end of block, first press Enter will insert a \n to break the line, second press Enter will insert a new block
    // 2. In the middle and start of block, press Enter will insert a \n to break the line
    // TODO: These block list may should be configurable in the block self
    const shouldSoftEnterFirstBlocks = [
      {
        flavour: 'affine:paragraph',
        type: 'quote',
      },
      {
        flavour: 'affine:code',
        type: 'code',
      },
    ];

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
      handleUnindent(page, model, index);
    } else if (isEnd) {
      const isSoftEnterBlock = shouldSoftEnterFirstBlocks.find(
        ({ flavour, type }) => {
          return model.flavour === flavour && model.type === type;
        }
      );

      const isNewLine = /\n\n$/.test(this.quill.getText());
      const shouldSoftEnter = isSoftEnterBlock && !isNewLine;

      if (shouldSoftEnter) {
        onSoftEnter.bind(this)();
      } else {
        // delete the \n at the end of block
        if (isSoftEnterBlock) {
          this.quill.deleteText(index, 1);
        }
        handleBlockEndEnter(page, model);
      }
    } else {
      const isSoftEnterBlock =
        shouldSoftEnterFirstBlocks.findIndex(({ flavour, type }) => {
          return model.flavour === flavour && model.type === type;
        }) !== -1;

      if (isSoftEnterBlock) {
        onSoftEnter.bind(this)();
      } else {
        handleBlockSplit(page, model, index);
      }
    }

    return PREVENT_DEFAULT;
  }

  function onSoftEnter(this: KeyboardEventThis) {
    const index = this.quill.getSelection()?.index || 0;
    handleSoftEnter(page, model, index);
    this.quill.setSelection(index + 1, 0);

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
      handler: hardEnter,
    },
    softEnter: {
      key: 'enter',
      shiftKey: true,
      handler: onSoftEnter,
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
      handler() {
        // TODO remove feature flag after slash menu is stable
        const params = new URLSearchParams(location.search);
        const flag = params.get('slash');
        if (flag === null) {
          return ALLOW_DEFAULT;
        }
        showSlashMenu({ page, model });
        return ALLOW_DEFAULT;
      },
    },
  };

  return keyboardBindings;
}
