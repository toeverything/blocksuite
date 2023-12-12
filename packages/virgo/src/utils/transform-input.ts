import type { VRange } from '../types.js';
import type { InlineEditor } from '../virgo.js';
import type { BaseTextAttributes } from './base-attributes.js';

function handleInsertText<TextAttributes extends BaseTextAttributes>(
  vRange: VRange,
  data: string | null,
  editor: InlineEditor,
  attributes: TextAttributes
) {
  if (!data) return;
  editor.insertText(vRange, data, attributes);
  editor.setVRange({
    index: vRange.index + data.length,
    length: 0,
  });
}

function handleInsertParagraph(vRange: VRange, editor: InlineEditor) {
  editor.insertLineBreak(vRange);
  editor.setVRange({
    index: vRange.index + 1,
    length: 0,
  });
}

function handleDelete(vRange: VRange, editor: InlineEditor) {
  editor.deleteText(vRange);
  editor.setVRange({
    index: vRange.index,
    length: 0,
  });
}

export function transformInput<TextAttributes extends BaseTextAttributes>(
  inputType: string,
  data: string | null,
  attributes: TextAttributes,
  vRange: VRange,
  editor: InlineEditor
) {
  if (!editor.isVRangeValid(vRange)) return;

  if (inputType === 'insertText') {
    handleInsertText(vRange, data, editor, attributes);
  } else if (
    inputType === 'insertParagraph' ||
    inputType === 'insertLineBreak'
  ) {
    handleInsertParagraph(vRange, editor);
  } else if (inputType.startsWith('delete')) {
    handleDelete(vRange, editor);
  } else {
    return;
  }
}
