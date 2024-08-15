import type { AffineInlineEditor } from '@blocksuite/affine-components/rich-text';
import type { EditorHost } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

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
} from '../rich-text-operations.js';

function isCollapsedAtBlockEnd(inlineEditor: AffineInlineEditor) {
  const inlineRange = inlineEditor.getInlineRange();
  return (
    inlineRange?.index === inlineEditor.yText.length &&
    inlineRange?.length === 0
  );
}

export function hardEnter(
  editorHost: EditorHost,
  model: BlockModel,
  range: InlineRange,
  e: KeyboardEvent,
  shortKey = false
) {
  e.stopPropagation();
  assertExists(model.text, 'Failed to hardEnter! model.text not exists!');
  const isEnd = model.text.length === range.index;
  if (isEnd || shortKey) {
    handleBlockEndEnter(editorHost, model);
    return KEYBOARD_PREVENT_DEFAULT;
  }
  handleBlockSplit(editorHost, model, range.index, range.length);
  return KEYBOARD_PREVENT_DEFAULT;
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
