import type { VRange } from '../types.js';
import type { VEditor } from '../virgo.js';

function handleInsertText(
  vRange: VRange,
  data: string | null,
  editor: VEditor
) {
  if (vRange.index >= 0 && data) {
    editor.slots.updated.once(() => {
      editor.slots.vRangeUpdated.emit([
        {
          index: vRange.index + data.length,
          length: 0,
        },
        'input',
      ]);
    });

    editor.insertText(vRange, data);
  }
}

function handleInsertParagraph(vRange: VRange, editor: VEditor) {
  if (vRange.index >= 0) {
    editor.slots.updated.once(() => {
      editor.slots.vRangeUpdated.emit([
        {
          index: vRange.index + 1,
          length: 0,
        },
        'input',
      ]);
    });

    editor.insertLineBreak(vRange);
  }
}

function handleDelete(vRange: VRange, editor: VEditor) {
  if (vRange.index >= 0) {
    if (vRange.length > 0) {
      editor.slots.updated.once(() => {
        editor.slots.vRangeUpdated.emit([
          {
            index: vRange.index,
            length: 0,
          },
          'input',
        ]);
      });

      editor.deleteText(vRange);
      return;
    }

    if (vRange.index > 0) {
      // https://dev.to/acanimal/how-to-slice-or-get-symbols-from-a-unicode-string-with-emojis-in-javascript-lets-learn-how-javascript-represent-strings-h3a
      const tmpString = editor.yText.toString().slice(0, vRange.index);
      const deletedCharacter = [...tmpString].slice(-1).join('');
      editor.slots.updated.once(() => {
        editor.slots.vRangeUpdated.emit([
          {
            index: vRange.index - deletedCharacter.length,
            length: 0,
          },
          'input',
        ]);
      });

      editor.deleteText({
        index: vRange.index - deletedCharacter.length,
        length: deletedCharacter.length,
      });
    }
  }
}

function handleWordDelete(editor: VEditor, vRange: VRange) {
  const matches = /\S+\s*$/.exec(
    editor.yText.toString().slice(0, vRange.index)
  );
  if (matches) {
    const deleteLength = matches[0].length;

    editor.slots.updated.once(() => {
      editor.slots.vRangeUpdated.emit([
        {
          index: vRange.index - deleteLength,
          length: 0,
        },
        'input',
      ]);
    });

    editor.deleteText({
      index: vRange.index - deleteLength,
      length: deleteLength,
    });
  }
}

function handleLineDelete(editor: VEditor, vRange: VRange) {
  if (vRange.length > 0) {
    editor.slots.updated.once(() => {
      editor.slots.vRangeUpdated.emit([
        {
          index: vRange.index,
          length: 0,
        },
        'input',
      ]);
    });

    editor.deleteText(vRange);
    return;
  }

  if (vRange.index > 0) {
    const str = editor.yText.toString();
    const deleteLength =
      vRange.index - Math.max(0, str.slice(0, vRange.index).lastIndexOf('\n'));

    editor.slots.updated.once(() => {
      editor.slots.vRangeUpdated.emit([
        {
          index: vRange.index - deleteLength,
          length: 0,
        },
        'input',
      ]);
    });

    editor.deleteText({
      index: vRange.index - deleteLength,
      length: deleteLength,
    });
  }
}

function handleForwardDelete(editor: VEditor, vRange: VRange) {
  if (vRange.index < editor.yText.length) {
    editor.slots.updated.once(() => {
      editor.slots.vRangeUpdated.emit([
        {
          index: vRange.index,
          length: 0,
        },
        'input',
      ]);
    });

    editor.deleteText({
      index: vRange.index,
      length: 1,
    });
  }
}

export function transformInput(
  inputType: string,
  data: string | null,
  vRange: VRange,
  editor: VEditor
) {
  // You can find explanation of inputType here:
  // [Input Events Level 2](https://w3c.github.io/input-events/#interface-InputEvent-Attributes)
  switch (inputType) {
    case 'insertText': {
      handleInsertText(vRange, data, editor);
      return;
    }

    case 'insertParagraph': {
      handleInsertParagraph(vRange, editor);
      return;
    }

    // Chrome and Safari on Mac: Backspace or Ctrl + H
    case 'deleteContentBackward':
    case 'deleteByCut': {
      handleDelete(vRange, editor);
      return;
    }

    // On Mac: Option + Backspace
    // On iOS: Hold the backspace for a while and the whole words will start to disappear
    case 'deleteWordBackward': {
      handleWordDelete(editor, vRange);
      return;
    }

    // deleteHardLineBackward: Safari on Mac: Cmd + Backspace
    // deleteSoftLineBackward: Chrome on Mac: Cmd + Backspace
    case 'deleteHardLineBackward':
    case 'deleteSoftLineBackward': {
      handleLineDelete(editor, vRange);
      return;
    }

    // Chrome on Mac: Fn + Backspace or Ctrl + D
    // Safari on Mac: Ctrl + K or Ctrl + D
    case 'deleteContentForward': {
      handleForwardDelete(editor, vRange);
      return;
    }
  }
}
