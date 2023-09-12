import type { VRange } from '../types.js';
import type { VEditor } from '../virgo.js';
import type { BaseTextAttributes } from './base-attributes.js';

function handleInsertText<TextAttributes extends BaseTextAttributes>(
  vRange: VRange,
  data: string | null,
  editor: VEditor,
  attributes: TextAttributes
) {
  if (vRange.index >= 0 && data) {
    editor.insertText(vRange, data, attributes);
    editor.setVRange(
      {
        index: vRange.index + data.length,
        length: 0,
      },
      false
    );
  }
}

function handleInsertParagraph(vRange: VRange, editor: VEditor) {
  if (vRange.index >= 0) {
    editor.insertLineBreak(vRange);
    editor.setVRange(
      {
        index: vRange.index + 1,
        length: 0,
      },
      false
    );
  }
}

function handleDeleteBackward(vRange: VRange, editor: VEditor) {
  if (vRange.index >= 0) {
    if (vRange.length > 0) {
      editor.deleteText(vRange);
      editor.setVRange(
        {
          index: vRange.index,
          length: 0,
        },
        false
      );
      return;
    }

    if (vRange.index > 0) {
      const originalString = editor.yText.toString().slice(0, vRange.index);
      const segments = [...new Intl.Segmenter().segment(originalString)];
      const deletedLength = segments[segments.length - 1].segment.length;
      editor.deleteText({
        index: vRange.index - deletedLength,
        length: deletedLength,
      });
      editor.setVRange(
        {
          index: vRange.index - deletedLength,
          length: 0,
        },
        false
      );
    }
  }
}

function handleDeleteForward(editor: VEditor, vRange: VRange) {
  if (vRange.index < editor.yText.length) {
    if (vRange.length > 0) {
      editor.deleteText(vRange);
      editor.setVRange(
        {
          index: vRange.index,
          length: 0,
        },
        false
      );
    } else {
      const originalString = editor.yText.toString();
      const segments = [...new Intl.Segmenter().segment(originalString)];
      const slicedString = originalString.slice(0, vRange.index);
      const slicedSegments = [...new Intl.Segmenter().segment(slicedString)];
      const deletedLength = segments[slicedSegments.length].segment.length;
      editor.deleteText({
        index: vRange.index,
        length: deletedLength,
      });
      editor.setVRange(
        {
          index: vRange.index,
          length: 0,
        },
        false
      );
    }
  }
}

function handleDeleteWordBackward(editor: VEditor, vRange: VRange) {
  const matches = /\S+\s*$/.exec(
    editor.yText.toString().slice(0, vRange.index)
  );
  if (matches) {
    const deleteLength = matches[0].length;

    editor.deleteText({
      index: vRange.index - deleteLength,
      length: deleteLength,
    });
    editor.setVRange(
      {
        index: vRange.index - deleteLength,
        length: 0,
      },
      false
    );
  }
}

function handleDeleteWordForward(editor: VEditor, vRange: VRange) {
  const matches = /^\s*\S+/.exec(editor.yText.toString().slice(vRange.index));
  if (matches) {
    const deleteLength = matches[0].length;

    editor.deleteText({
      index: vRange.index,
      length: deleteLength,
    });
    editor.setVRange(
      {
        index: vRange.index,
        length: 0,
      },
      false
    );
  }
}

function handleDeleteLine(editor: VEditor, vRange: VRange) {
  if (vRange.length > 0) {
    editor.deleteText(vRange);
    editor.setVRange(
      {
        index: vRange.index,
        length: 0,
      },
      false
    );

    return;
  }

  if (vRange.index > 0) {
    const str = editor.yText.toString();
    const deleteLength =
      vRange.index - Math.max(0, str.slice(0, vRange.index).lastIndexOf('\n'));

    editor.deleteText({
      index: vRange.index - deleteLength,
      length: deleteLength,
    });
    editor.setVRange(
      {
        index: vRange.index - deleteLength,
        length: 0,
      },
      false
    );
  }
}

export function transformInput<TextAttributes extends BaseTextAttributes>(
  inputType: string,
  data: string | null,
  attributes: TextAttributes,
  vRange: VRange,
  editor: VEditor
) {
  // You can find explanation of inputType here:
  // [Input Events Level 2](https://w3c.github.io/input-events/#interface-InputEvent-Attributes)
  switch (inputType) {
    case 'insertText': {
      handleInsertText(vRange, data, editor, attributes);
      return;
    }

    case 'insertParagraph': {
      handleInsertParagraph(vRange, editor);
      return;
    }

    // Chrome and Safari on Mac: Backspace or Ctrl + H
    case 'deleteContentBackward':
    case 'deleteByCut': {
      handleDeleteBackward(vRange, editor);
      return;
    }

    // Chrome on Mac: Fn + Backspace or Ctrl + D
    // Safari on Mac: Ctrl + K or Ctrl + D
    case 'deleteContentForward': {
      handleDeleteForward(editor, vRange);
      return;
    }

    // On Mac: Option + Backspace
    // On iOS: Hold the backspace for a while and the whole words will start to disappear
    case 'deleteWordBackward': {
      handleDeleteWordBackward(editor, vRange);
      return;
    }

    // onMac: Fn + Option + Backspace
    // onWindows: Control + Delete
    case 'deleteWordForward': {
      handleDeleteWordForward(editor, vRange);
      return;
    }

    // deleteHardLineBackward: Safari on Mac: Cmd + Backspace
    // deleteSoftLineBackward: Chrome on Mac: Cmd + Backspace
    case 'deleteHardLineBackward':
    case 'deleteSoftLineBackward': {
      handleDeleteLine(editor, vRange);
      return;
    }
  }
}
