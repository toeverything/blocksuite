import { ALLOW_DEFAULT, PREVENT_DEFAULT } from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';

import type { BindingContext } from '../rich-text/keyboard.js';
import {
  markdownConvert,
  tryMatchSpaceHotkey,
} from '../rich-text/markdown-convert.js';
import {
  handleBlockEndEnter,
  handleBlockSplit,
  handleLineEndDelete,
  handleLineStartBackspace,
  handleSoftEnter,
  handleUnindent,
} from '../rich-text/rich-text-operations.js';
import type { AffineVEditor } from '../rich-text/virgo/types.js';
import {
  isCollapsedAtBlockEnd,
  isCollapsedAtBlockStart,
} from '../utils/index.js';

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
    matchFlavours(parent, ['affine:frame', 'affine:database']) &&
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
  range: VRange,
  context: BindingContext
) {
  const { prefix } = context;
  markdownConvert(virgo, model, prefix);
  return ALLOW_DEFAULT;
}

export function spaceMarkdownMatch(
  model: BaseBlockModel,
  virgo: AffineVEditor,
  range: VRange,
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
  e.stopPropagation();
  if (isCollapsedAtBlockStart(vEditor)) {
    handleLineStartBackspace(model.page, model);
    return PREVENT_DEFAULT;
  }
  return ALLOW_DEFAULT;
}

export function onDelete(
  model: BaseBlockModel,
  e: KeyboardEvent,
  vEditor: AffineVEditor
) {
  e.stopPropagation();
  if (isCollapsedAtBlockEnd(vEditor)) {
    handleLineEndDelete(model.page, model);
    return PREVENT_DEFAULT;
  }
  return ALLOW_DEFAULT;
}

export function onKeyLeft(e: KeyboardEvent, range: VRange) {
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
