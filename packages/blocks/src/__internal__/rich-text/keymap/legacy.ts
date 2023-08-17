import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';

import { ALLOW_DEFAULT, PREVENT_DEFAULT } from '../../consts.js';
import { matchFlavours } from '../../utils/model.js';
import type { KeyboardBindings } from '../keyboard.js';
import type { BindingContext } from '../keyboard.js';
import { markdownConvert, tryMatchSpaceHotkey } from '../markdown-convert.js';
import {
  handleBlockEndEnter,
  handleBlockSplit,
  handleIndent,
  handleKeyDown,
  handleKeyUp,
  handleLineEndForwardDelete,
  handleLineStartBackspace,
  handleSoftEnter,
  handleUnindent,
} from '../rich-text-operations.js';
import type { AffineVEditor } from '../virgo/types.js';

export function isCollapsedAtBlockStart(vEditor: AffineVEditor) {
  const vRange = vEditor.getVRange();
  return vRange?.index === 0 && vRange?.length === 0;
}

export function isCollapsedAtBlockEnd(vEditor: AffineVEditor) {
  const vRange = vEditor.getVRange();
  return vRange?.index === vEditor.yText.length && vRange?.length === 0;
}

export function onSoftEnter(
  model: BaseBlockModel,
  range: VRange,
  vEditor: AffineVEditor
) {
  handleSoftEnter(model.page, model, range.index, range.length);
  vEditor.setVRange({
    index: range.index + 1,
    length: 0,
  });
  return PREVENT_DEFAULT;
}

export function hardEnter(
  model: BaseBlockModel,
  range: VRange,
  /**
   * @deprecated
   */
  vEditor: AffineVEditor,
  e: KeyboardEvent,
  shortKey = false
) {
  const page = model.page;
  e.stopPropagation();
  const parent = page.getParent(model);
  const isLastChild = parent?.lastChild() === model;
  const isEmptyList =
    matchFlavours(model, ['affine:list']) && model.text.length === 0;

  assertExists(model.text, 'Failed to hardEnter! model.text not exists!');

  if (
    isEmptyList &&
    parent &&
    matchFlavours(parent, ['affine:note', 'affine:database']) &&
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
    const endWithTwoBlankLines = textStr === '\n' || textStr.endsWith('\n');
    const shouldSoftEnter = softEnterable && !endWithTwoBlankLines;

    if (shouldSoftEnter) {
      // TODO handle ctrl+enter in code/quote block or other force soft enter block
      onSoftEnter(model, range, vEditor);
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
    onSoftEnter(model, range, vEditor);
    return PREVENT_DEFAULT;
  }

  handleBlockSplit(page, model, range.index, range.length);
  return PREVENT_DEFAULT;
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

export function enterMarkdownMatch(
  model: BaseBlockModel,
  virgo: AffineVEditor,
  _range: VRange,
  context: BindingContext
) {
  const { prefix } = context;
  markdownConvert(virgo, model, prefix);
  return ALLOW_DEFAULT;
}

export function spaceMarkdownMatch(
  model: BaseBlockModel,
  virgo: AffineVEditor,
  _range: VRange,
  context: BindingContext
) {
  const { prefix } = context;
  return markdownConvert(virgo, model, prefix)
    ? PREVENT_DEFAULT
    : ALLOW_DEFAULT;
}

export function onSpace(
  model: BaseBlockModel,
  virgo: AffineVEditor,
  range: VRange,
  context: BindingContext
) {
  const { prefix } = context;
  return tryMatchSpaceHotkey(model.page, model, virgo, prefix, range);
}

export function onBackspace(
  model: BaseBlockModel,
  e: KeyboardEvent,
  vEditor: AffineVEditor
) {
  if (isCollapsedAtBlockStart(vEditor)) {
    if (model.flavour === 'affine:code') {
      return ALLOW_DEFAULT;
    }
    e.stopPropagation();
    handleLineStartBackspace(model.page, model);
    return PREVENT_DEFAULT;
  }
  e.stopPropagation();
  return ALLOW_DEFAULT;
}

export function onForwardDelete(
  model: BaseBlockModel,
  e: KeyboardEvent,
  vEditor: AffineVEditor
) {
  e.stopPropagation();
  if (isCollapsedAtBlockEnd(vEditor)) {
    handleLineEndForwardDelete(model.page, model);
    return PREVENT_DEFAULT;
  }
  return ALLOW_DEFAULT;
}

export function onKeyLeft(
  _model: BaseBlockModel,
  e: KeyboardEvent,
  range: VRange,
  _editableContainer: Element
) {
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

export function onKeyRight(
  model: BaseBlockModel,
  e: KeyboardEvent,
  range: VRange
) {
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

const commonRichTextKeymap = <T extends BaseBlockModel>(
  block: T,
  virgo: AffineVEditor
): KeyboardBindings => {
  return {
    enterMarkdownMatch: {
      key: 'Enter',
      handler: (range, context) => {
        assertExists(virgo);
        return enterMarkdownMatch(block, virgo, range, context);
      },
    },
    spaceMarkdownMatch: {
      key: ' ',
      handler(range, context) {
        assertExists(virgo);
        return spaceMarkdownMatch(block, virgo, range, context);
      },
    },
    hardEnter: {
      key: 'Enter',
      handler(range, context) {
        assertExists(virgo);
        return hardEnter(block, range, virgo, context.event);
      },
    },
    softEnter: {
      key: 'Enter',
      shiftKey: true,
      handler(range) {
        assertExists(virgo);
        return onSoftEnter(block, range, virgo);
      },
    },
    // shortKey+enter
    insertLineAfter: {
      key: 'Enter',
      shortKey: true,
      handler(range, context) {
        assertExists(virgo);
        return hardEnter(block, range, virgo, context.event, true);
      },
    },
    tab: {
      key: 'Tab',
      handler(range, context) {
        const index = range.index;
        handleIndent(block.page, block, index);
        context.event.stopPropagation();
        return PREVENT_DEFAULT;
      },
    },
    shiftTab: {
      key: 'Tab',
      shiftKey: true,
      handler(range, context) {
        const index = range.index;
        handleUnindent(block.page, block, index);
        context.event.stopPropagation();
        return PREVENT_DEFAULT;
      },
    },
    backspace: {
      key: 'Backspace',
      handler(_range, context) {
        return onBackspace(block, context.event, this.vEditor);
      },
    },
    delete: {
      key: 'Delete',
      handler(_range, context) {
        return onForwardDelete(block, context.event, this.vEditor);
      },
    },
    up: {
      key: 'ArrowUp',
      shiftKey: false,
      handler(_range, context) {
        return handleKeyUp(context.event, this.vEditor.rootElement);
      },
    },
    down: {
      key: 'ArrowDown',
      shiftKey: false,
      handler(_range, context) {
        return handleKeyDown(block, context.event, this.vEditor.rootElement);
      },
    },
    left: {
      key: 'ArrowLeft',
      shiftKey: false,
      handler(range, context) {
        return onKeyLeft(block, context.event, range, this.vEditor.rootElement);
      },
    },
    right: {
      key: 'ArrowRight',
      shiftKey: false,
      handler(range, context) {
        return onKeyRight(block, context.event, range);
      },
    },
    inputRule: {
      key: ' ',
      shiftKey: null,
      prefix: /^(\d+\.|-|\*|\[ ?\]|\[x\]|(#){1,6}|(-){3}|(\*){3}|>)$/,
      handler(range, context) {
        return onSpace(block, virgo, range, context);
      },
    },
  };
};

const codeRichTextKeymap = <T extends BaseBlockModel>(
  _block: T,
  _virgo: AffineVEditor
): KeyboardBindings => {
  const INDENT_SYMBOL = '  ';
  const LINE_BREAK_SYMBOL = '\n';
  const allIndexOf = (
    text: string,
    symbol: string,
    start = 0,
    end = text.length
  ) => {
    const indexArr: number[] = [];
    let i = start;

    while (i < end) {
      const index = text.indexOf(symbol, i);
      if (index === -1 || index > end) {
        break;
      }
      indexArr.push(index);
      i = index + 1;
    }
    return indexArr;
  };

  return {
    tab: {
      key: 'Tab',
      handler(range, context) {
        context.event.stopPropagation();
        const text = this.vEditor.yText.toString();
        const index = text.lastIndexOf(LINE_BREAK_SYMBOL, range.index - 1);
        const indexArr = allIndexOf(
          text,
          LINE_BREAK_SYMBOL,
          range.index,
          range.index + range.length
        )
          .map(i => i + 1)
          .reverse();
        if (index !== -1) {
          indexArr.push(index + 1);
        } else {
          indexArr.push(0);
        }
        indexArr.forEach(i => {
          this.vEditor.insertText(
            {
              index: i,
              length: 0,
            },
            INDENT_SYMBOL
          );
        });
        this.vEditor.setVRange({
          index: range.index + 2,
          length: range.length + (indexArr.length - 1) * INDENT_SYMBOL.length,
        });

        return PREVENT_DEFAULT;
      },
    },
    shiftTab: {
      key: 'Tab',
      shiftKey: true,
      handler: function (range, context) {
        context.event.stopPropagation();
        const text = this.vEditor.yText.toString();
        const index = text.lastIndexOf(LINE_BREAK_SYMBOL, range.index - 1);
        let indexArr = allIndexOf(
          text,
          LINE_BREAK_SYMBOL,
          range.index,
          range.index + range.length
        )
          .map(i => i + 1)
          .reverse();
        if (index !== -1) {
          indexArr.push(index + 1);
        } else {
          indexArr.push(0);
        }
        indexArr = indexArr.filter(i => text.slice(i, i + 2) === INDENT_SYMBOL);
        indexArr.forEach(i => {
          this.vEditor.deleteText({
            index: i,
            length: 2,
          });
        });
        if (indexArr.length > 0) {
          this.vEditor.setVRange({
            index:
              range.index -
              (indexArr[indexArr.length - 1] < range.index ? 2 : 0),
            length: range.length - (indexArr.length - 1) * INDENT_SYMBOL.length,
          });
        }

        return PREVENT_DEFAULT;
      },
    },
  };
};

// FIXME: this keymap file should be migrated to the new `bindHotkey` API
// Please don't add new keymap here
export const createRichTextKeymap = <T extends BaseBlockModel>(
  block: T,
  virgo: AffineVEditor
): KeyboardBindings => {
  const common = commonRichTextKeymap(block, virgo);
  if (block.flavour === 'affine:code') {
    const code = codeRichTextKeymap(block, virgo);
    return {
      ...common,
      ...code,
    };
  }

  return common;
};
