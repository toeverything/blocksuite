import type { InlineEditor } from '../inline-editor.js';
import type { InlineRange } from '../types.js';
import type { BaseTextAttributes } from './base-attributes.js';

function handleInsertText<TextAttributes extends BaseTextAttributes>(
  inlineRange: InlineRange,
  data: string | null,
  editor: InlineEditor,
  attributes: TextAttributes
) {
  if (!data) return;
  editor.insertText(inlineRange, data, attributes);
  editor.setInlineRange({
    index: inlineRange.index + data.length,
    length: 0,
  });
}

function handleInsertParagraph(inlineRange: InlineRange, editor: InlineEditor) {
  editor.insertLineBreak(inlineRange);
  editor.setInlineRange({
    index: inlineRange.index + 1,
    length: 0,
  });
}

function handleDelete(inlineRange: InlineRange, editor: InlineEditor) {
  editor.deleteText(inlineRange);
  editor.setInlineRange({
    index: inlineRange.index,
    length: 0,
  });
}

export function transformInput<TextAttributes extends BaseTextAttributes>(
  inputType: string,
  data: string | null,
  attributes: TextAttributes,
  inlineRange: InlineRange,
  editor: InlineEditor
) {
  if (!editor.isValidInlineRange(inlineRange)) return;

  if (inputType === 'insertText') {
    handleInsertText(inlineRange, data, editor, attributes);
  } else if (
    inputType === 'insertParagraph' ||
    inputType === 'insertLineBreak'
  ) {
    handleInsertParagraph(inlineRange, editor);
  } else if (inputType.startsWith('delete')) {
    handleDelete(inlineRange, editor);
  } else {
    return;
  }
}
