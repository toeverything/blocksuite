import type { EditorHost } from '@blocksuite/block-std';

import { getDocTitleInlineEditor } from './query.js';

/**
 * As the title is a text area, this function does not yet have support for `SelectionPosition`.
 */
export function focusTitle(editorHost: EditorHost, index = Infinity, len = 0) {
  const titleInlineEditor = getDocTitleInlineEditor(editorHost);
  if (!titleInlineEditor) {
    return;
  }

  if (index > titleInlineEditor.yText.length) {
    index = titleInlineEditor.yText.length;
  }
  titleInlineEditor.setInlineRange({ index, length: len });
}
