import type { AffineInlineEditor } from '@blocksuite/affine-components/rich-text';
import type { EditorHost } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { matchFlavours } from '@blocksuite/affine-shared/utils';
import { assertExists } from '@blocksuite/global/utils';
import {
  type InlineRange,
  KEYBOARD_ALLOW_DEFAULT,
  KEYBOARD_PREVENT_DEFAULT,
} from '@blocksuite/inline';

import {
  handleBlockEndEnter,
  handleBlockSplit,
  handleLineEndForwardDelete,
  handleLineStartBackspace,
  handleUnindent,
} from '../rich-text-operations.js';

function isCollapsedAtBlockStart(inlineEditor: AffineInlineEditor) {
  const inlineRange = inlineEditor.getInlineRange();
  return inlineRange?.index === 0 && inlineRange?.length === 0;
}

function isCollapsedAtBlockEnd(inlineEditor: AffineInlineEditor) {
  const inlineRange = inlineEditor.getInlineRange();
  return (
    inlineRange?.index === inlineEditor.yText.length &&
    inlineRange?.length === 0
  );
}

export function onSoftEnter(
  inlineRange: InlineRange,
  inlineEditor: AffineInlineEditor
) {
  inlineEditor.insertText(inlineRange, '\n');
  inlineEditor.setInlineRange({
    index: inlineRange.index + 1,
    length: 0,
  });
  return KEYBOARD_PREVENT_DEFAULT;
}

export function hardEnter(
  editorHost: EditorHost,
  model: BlockModel,
  range: InlineRange,
  /**
   * @deprecated
   */
  inlineEditor: AffineInlineEditor,
  e: KeyboardEvent,
  shortKey = false
) {
  const doc = model.doc;
  e.stopPropagation();
  const parent = doc.getParent(model);
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
    handleLineStartBackspace(editorHost, model);
    return KEYBOARD_PREVENT_DEFAULT;
  }
  if (isEmptyList && isLastChild) {
    // Before
    // - line1
    //   - ↩ <-- press Enter
    //
    // After
    // - line1
    // - | <-- will unindent the block
    handleUnindent(editorHost, model, range.index);
    return KEYBOARD_PREVENT_DEFAULT;
  }
  const isEnd = model.text.length === range.index;
  const softEnterable = isSoftEnterable(model);
  if (isEnd && softEnterable) {
    if (matchFlavours(model, ['affine:code'])) {
      if (shortKey) {
        // shortKey+Enter to exit the block
        handleBlockEndEnter(editorHost, model);
        return KEYBOARD_PREVENT_DEFAULT;
      }

      // add a new line to the block when press Enter solely
      onSoftEnter(range, inlineEditor);
      return KEYBOARD_PREVENT_DEFAULT;
    }

    const textStr = model.text.toString();
    const endWithTwoBlankLines = textStr === '\n' || textStr.endsWith('\n');
    const shouldSoftEnter = softEnterable && !endWithTwoBlankLines;

    if (shouldSoftEnter || shortKey) {
      onSoftEnter(range, inlineEditor);
      return KEYBOARD_PREVENT_DEFAULT;
    }

    // delete the \n at the end of block
    // Before
    // >
    // > ↩ <-- press Enter
    //
    // After
    // - line1
    // - | <-- will unindent the block
    model.text.delete(range.index - 1, 1);
    handleBlockEndEnter(editorHost, model);
    return KEYBOARD_PREVENT_DEFAULT;
  }
  if (isEnd || shortKey) {
    handleBlockEndEnter(editorHost, model);
    return KEYBOARD_PREVENT_DEFAULT;
  }
  const isSoftEnterBlock = isSoftEnterable(model);
  if (isSoftEnterBlock) {
    onSoftEnter(range, inlineEditor);
    return KEYBOARD_PREVENT_DEFAULT;
  }
  handleBlockSplit(editorHost, model, range.index, range.length)?.catch(
    console.error
  );
  return KEYBOARD_PREVENT_DEFAULT;
}

// If a block is soft enterable, the rule is:
// 1. In the end of block, first press Enter will insert a \n to break the line, second press Enter will insert a new block
// 2. In the middle and start of block, press Enter will insert a \n to break the line
// TODO this should be configurable per-block
function isSoftEnterable(model: BlockModel) {
  if (matchFlavours(model, ['affine:code'])) return true;
  if (matchFlavours(model, ['affine:paragraph'])) {
    return model.type === 'quote';
  }
  return false;
}

export function onBackspace(
  editorHost: EditorHost,
  model: BlockModel,
  e: KeyboardEvent,
  inlineEditor: AffineInlineEditor
) {
  if (isCollapsedAtBlockStart(inlineEditor)) {
    if (model.flavour === 'affine:code') {
      return KEYBOARD_ALLOW_DEFAULT;
    }
    e.stopPropagation();
    handleLineStartBackspace(editorHost, model);
    return KEYBOARD_PREVENT_DEFAULT;
  }
  e.stopPropagation();
  return KEYBOARD_ALLOW_DEFAULT;
}

export function onForwardDelete(
  editorHost: EditorHost,
  model: BlockModel,
  e: KeyboardEvent,
  inlineEditor: AffineInlineEditor
) {
  e.stopPropagation();
  if (isCollapsedAtBlockEnd(inlineEditor)) {
    handleLineEndForwardDelete(editorHost, model);
    return KEYBOARD_PREVENT_DEFAULT;
  }
  return KEYBOARD_ALLOW_DEFAULT;
}
