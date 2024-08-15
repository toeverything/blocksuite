import type { EditorHost } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { assertExists } from '@blocksuite/global/utils';
import { type InlineRange, KEYBOARD_PREVENT_DEFAULT } from '@blocksuite/inline';

import {
  handleBlockEndEnter,
  handleBlockSplit,
} from '../rich-text-operations.js';

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
