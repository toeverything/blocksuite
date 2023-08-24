import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import {
  VKEYBOARD_ALLOW_DEFAULT,
  VKEYBOARD_PREVENT_DEFAULT,
  type VRange,
} from '@blocksuite/virgo';

import { matchFlavours } from '../../utils/model.js';
import {
  handleBlockEndEnter,
  handleBlockSplit,
  handleLineEndForwardDelete,
  handleLineStartBackspace,
  handleUnindent,
} from '../rich-text-operations.js';
import type { AffineVEditor } from '../virgo/types.js';

function isCollapsedAtBlockStart(vEditor: AffineVEditor) {
  const vRange = vEditor.getVRange();
  return vRange?.index === 0 && vRange?.length === 0;
}

function isCollapsedAtBlockEnd(vEditor: AffineVEditor) {
  const vRange = vEditor.getVRange();
  return vRange?.index === vEditor.yText.length && vRange?.length === 0;
}

export function onSoftEnter(vRange: VRange, vEditor: AffineVEditor) {
  vEditor.insertText(vRange, '\n');
  vEditor.setVRange({
    index: vRange.index + 1,
    length: 0,
  });
  return VKEYBOARD_PREVENT_DEFAULT;
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
    return VKEYBOARD_PREVENT_DEFAULT;
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
    return VKEYBOARD_PREVENT_DEFAULT;
  }

  const isEnd = model.text.length === range.index;
  if (isEnd || shortKey) {
    const softEnterable = isSoftEnterable(model);
    const textStr = model.text.toString();
    const endWithTwoBlankLines = textStr === '\n' || textStr.endsWith('\n');
    const shouldSoftEnter = softEnterable && !endWithTwoBlankLines;

    if (shouldSoftEnter) {
      // TODO handle ctrl+enter in code/quote block or other force soft enter block
      onSoftEnter(range, vEditor);
      return VKEYBOARD_PREVENT_DEFAULT;
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
    return VKEYBOARD_PREVENT_DEFAULT;
  }

  const isSoftEnterBlock = isSoftEnterable(model);
  if (isSoftEnterBlock) {
    onSoftEnter(range, vEditor);
    return VKEYBOARD_PREVENT_DEFAULT;
  }

  handleBlockSplit(page, model, range.index, range.length);
  return VKEYBOARD_PREVENT_DEFAULT;
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

export function onBackspace(
  model: BaseBlockModel,
  e: KeyboardEvent,
  vEditor: AffineVEditor
) {
  if (isCollapsedAtBlockStart(vEditor)) {
    if (model.flavour === 'affine:code') {
      return VKEYBOARD_ALLOW_DEFAULT;
    }
    e.stopPropagation();
    handleLineStartBackspace(model.page, model);
    return VKEYBOARD_PREVENT_DEFAULT;
  }
  e.stopPropagation();
  return VKEYBOARD_ALLOW_DEFAULT;
}

export function onForwardDelete(
  model: BaseBlockModel,
  e: KeyboardEvent,
  vEditor: AffineVEditor
) {
  e.stopPropagation();
  if (isCollapsedAtBlockEnd(vEditor)) {
    handleLineEndForwardDelete(model.page, model);
    return VKEYBOARD_PREVENT_DEFAULT;
  }
  return VKEYBOARD_ALLOW_DEFAULT;
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
    return VKEYBOARD_ALLOW_DEFAULT;
  }
  const lineStart = range.index === 0;
  if (!lineStart) {
    e.stopPropagation();
    return VKEYBOARD_ALLOW_DEFAULT;
  }
  // Need jump to previous block
  return VKEYBOARD_PREVENT_DEFAULT;
}

export function onKeyRight(
  model: BaseBlockModel,
  e: KeyboardEvent,
  range: VRange
) {
  if (range.length !== 0) {
    e.stopPropagation();
    return VKEYBOARD_ALLOW_DEFAULT;
  }
  assertExists(model.text, 'Failed to onKeyRight! model.text not exists!');
  const textLength = model.text.length;
  const lineEnd = textLength === range.index;
  if (!lineEnd) {
    e.stopPropagation();
    return VKEYBOARD_ALLOW_DEFAULT;
  }
  // Need jump to next block
  return VKEYBOARD_PREVENT_DEFAULT;
}
