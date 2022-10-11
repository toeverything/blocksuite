import {
  ALLOW_DEFAULT,
  BlockHost,
  handleBlockEndEnter,
  handleBlockSplit,
  handleIndent,
  handleKeyDown,
  handleKeyUp,
  handleLineStartBackspace,
  handleSoftEnter,
  handleUnindent,
  PREVENT_DEFAULT,
  tryMatchSpaceHotkey,
} from '@blocksuite/shared';
import { Shortcuts } from './shortcuts';
import type { BaseBlockModel, Store } from '@blocksuite/store';
import { Quill, type RangeStatic } from 'quill';
import { SnowTooltip } from './link-node/SnowTooltip';

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

function isAtBlockStart(quill: Quill) {
  return quill.getSelection(true)?.index === 0;
}

export const createKeyboardBindings = (
  store: Store,
  model: BaseBlockModel,
  selectionManager: BlockHost['selection']
) => {
  function undo() {
    store.undo();
    return PREVENT_DEFAULT;
  }

  function redo() {
    store.redo();
    return PREVENT_DEFAULT;
  }

  function markdownMatch(this: KeyboardEventThis) {
    Shortcuts.match(this.quill, model);
    return ALLOW_DEFAULT;
  }

  function hardEnter(this: KeyboardEventThis) {
    const isEnd = isAtBlockEnd(this.quill);
    if (isEnd) {
      handleBlockEndEnter(store, model);
    } else {
      const index = this.quill.getSelection()?.index || 0;
      handleBlockSplit(store, model, index);
    }

    return PREVENT_DEFAULT;
  }

  function softEnter(this: KeyboardEventThis) {
    const index = this.quill.getSelection()?.index || 0;
    handleSoftEnter(store, model, index);
    this.quill.setSelection(index + 1, 0);

    return PREVENT_DEFAULT;
  }

  function indent(this: KeyboardEventThis) {
    handleIndent(store, model);
    return PREVENT_DEFAULT;
  }

  function unindent(this: KeyboardEventThis) {
    handleUnindent(store, model);
    return PREVENT_DEFAULT;
  }

  function keyUp(this: KeyboardEventThis, range: QuillRange) {
    if (range.index >= 0) {
      return handleKeyUp(model, selectionManager, this.quill.root);
    }
    return ALLOW_DEFAULT;
  }

  function keyDown(this: KeyboardEventThis, range: QuillRange) {
    if (range.index >= 0) {
      return handleKeyDown(model, selectionManager, this.quill.root);
    }
    return ALLOW_DEFAULT;
  }

  function keyLeft(this: KeyboardEventThis, range: QuillRange) {
    if (range.index === 0) {
      selectionManager.activatePreviousBlock(model.id, 'end');
      return PREVENT_DEFAULT;
    }
    return ALLOW_DEFAULT;
  }

  function keyRight(this: KeyboardEventThis, range: QuillRange) {
    const textLength = this.quill.getText().length;
    if (range.index + 1 === textLength) {
      selectionManager.activateNextBlock(model.id, 'start');
      return PREVENT_DEFAULT;
    }
    return ALLOW_DEFAULT;
  }

  function space(
    this: KeyboardEventThis,
    range: QuillRange,
    context: BindingContext
  ) {
    const { quill } = this;
    const { prefix } = context;
    return tryMatchSpaceHotkey(store, model, quill, prefix, range);
  }

  function backspace(this: KeyboardEventThis) {
    if (isAtBlockStart(this.quill)) {
      handleLineStartBackspace(store, model);
      return PREVENT_DEFAULT;
    }

    return ALLOW_DEFAULT;
  }

  // scend selectAll should select all blocks
  let _firstSelectAll = true;

  function selectAll(this: KeyboardEventThis) {
    if (!_firstSelectAll) {
      selectionManager.selectAllBlocks();
    }
    _firstSelectAll = false;
    return ALLOW_DEFAULT;
  }

  // See https://github.com/quilljs/quill/blob/6fb1532fbdcfb2d5df4830a81e707160a72da47b/themes/snow.ts#L110-L126
  // See https://github.com/patleeman/quill-markdown-shortcuts/blob/master/src/index.js#L216-L232
  function createLink(
    this: KeyboardEventThis,
    range: QuillRange,
    context: BindingContext
  ) {
    if (context.format.link) {
      // already have a link
      this.quill.format('link', false);
      return PREVENT_DEFAULT;
    }
    if (range == null || range.length === 0) {
      // select nothing
      return ALLOW_DEFAULT;
    }

    let preview = this.quill.getText(range.index, range.length);
    if (/^\S+@\S+\.\S+$/.test(preview) && preview.indexOf('mailto:') !== 0) {
      preview = `mailto:${preview}`;
    }

    // @ts-ignore
    const tooltip = new SnowTooltip(this.quill, document.body);
    // @ts-ignore
    tooltip.edit('link', preview);

    // backup selection format
    // const format = this.quill.getFormat(range.index, range.length);
    // mock selection
    // this.quill.formatText(
    //   range.index,
    //   range.length,
    //   'background',
    //   'rgba(35, 131, 226, 0.28)'
    // );

    // setTimeout(() => {
    // cancel mock selection
    // restore background
    // this.quill.formatText(
    //   range.index,
    //   range.length,
    //   'background',
    //   format['background'] ?? false
    // );
    // }, 1000);

    // const selection = window.getSelection();
    // const rect = selection.getRangeAt(0).getBoundingClientRect();
    // const container = this.quill.addContainer('ql-tooltip');

    return PREVENT_DEFAULT;
  }

  const keyboardBindings: KeyboardBindings = {
    undo: {
      key: 'z',
      shortKey: true,
      handler: undo,
    },
    redo: {
      key: 'z',
      shiftKey: true,
      shortKey: true,
      handler: redo,
    },
    enterMarkdownMatch: {
      key: 'enter',
      handler: markdownMatch,
    },
    spaceMarkdownMatch: {
      key: ' ',
      handler: markdownMatch,
    },
    hardEnter: {
      key: 'enter',
      handler: hardEnter,
    },
    softEnter: {
      key: 'enter',
      shiftKey: true,
      handler: softEnter,
    },
    tab: {
      key: 'tab',
      handler: indent,
    },
    shiftTab: {
      key: 'tab',
      shiftKey: true,
      handler: unindent,
    },
    // https://github.com/quilljs/quill/blob/v1.3.7/modules/keyboard.js#L249-L282
    'list autofill': {
      key: ' ',
      prefix: /^\s*?(\d+\.|-|\*|\[ ?\]|\[x\]|(#){1,6})|>$/,
      handler: space,
    },
    backspace: {
      key: 'backspace',
      handler: backspace,
    },
    up: {
      key: 'up',
      shiftKey: false,
      handler: keyUp,
    },
    down: {
      key: 'down',
      shiftKey: false,
      handler: keyDown,
    },
    'embed left': {
      key: 37,
      shiftKey: false,
      handler: keyLeft,
    },
    right: {
      key: 'right',
      shiftKey: false,
      handler: keyRight,
    },
    selectAll: {
      key: 'a',
      shortKey: true,
      handler: selectAll,
    },
    createLink: {
      key: 'k',
      shortKey: true,
      handler: createLink,
    },
  };

  return keyboardBindings;
};
