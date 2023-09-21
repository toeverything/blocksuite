import type { VRange } from '../types.js';
import type { VEditor } from '../virgo.js';
import type { BaseTextAttributes } from './base-attributes.js';

function handleInsertText<TextAttributes extends BaseTextAttributes>(
  vRange: VRange,
  data: string | null,
  editor: VEditor,
  attributes: TextAttributes
) {
  if (!data) return;
  editor.insertText(vRange, data, attributes);
  editor.setVRange(
    {
      index: vRange.index + data.length,
      length: 0,
    },
    false
  );
}

function handleInsertParagraph(vRange: VRange, editor: VEditor) {
  editor.insertLineBreak(vRange);
  editor.setVRange(
    {
      index: vRange.index + 1,
      length: 0,
    },
    false
  );
}

function handleDelete(vRange: VRange, editor: VEditor) {
  editor.deleteText(vRange);
  editor.setVRange(
    {
      index: vRange.index,
      length: 0,
    },
    false
  );
}

export function transformInput<TextAttributes extends BaseTextAttributes>(
  inputType: string,
  data: string | null,
  attributes: TextAttributes,
  vRange: VRange,
  editor: VEditor
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
