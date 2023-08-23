import type { VEditor, VRange } from '@blocksuite/virgo';
import type * as Y from 'yjs';

interface MarkdownMatch {
  name: string;
  pattern: RegExp;
  action: (props: {
    vEditor: VEditor;
    prefixText: string;
    vRange: VRange;
    pattern: RegExp;
    undoManager: Y.UndoManager;
  }) => boolean;
}

export const markdownMatches: MarkdownMatch[] = [
  {
    name: 'bolditalic',
    pattern: /(?:\*){3}([^* \n](.+?[^* \n])?)(?:\*){3}$/g,
    action: ({ vEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return false;
      }

      const annotatedText = match[0];
      const startIndex = vRange.index - annotatedText.length;

      vEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );

      undoManager.stopCapturing();

      vEditor.formatText(
        {
          index: startIndex,
          length: annotatedText.length,
        },
        {
          bold: true,
          italic: true,
        }
      );

      vEditor.deleteText({
        index: startIndex + annotatedText.length,
        length: 1,
      });
      vEditor.deleteText({
        index: startIndex + annotatedText.length - 3,
        length: 3,
      });
      vEditor.deleteText({
        index: startIndex,
        length: 3,
      });

      vEditor.setVRange({
        index: startIndex + annotatedText.length - 6,
        length: 0,
      });

      return true;
    },
  },
  {
    name: 'bold',
    pattern: /(?:\*){2}([^* \n](.+?[^* \n])?)(?:\*){2}$/g,
    action: ({ vEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return false;
      }
      const annotatedText = match[0];
      const startIndex = vRange.index - annotatedText.length;

      vEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );

      undoManager.stopCapturing();

      vEditor.formatText(
        {
          index: startIndex,
          length: annotatedText.length,
        },
        {
          bold: true,
        }
      );

      vEditor.deleteText({
        index: startIndex + annotatedText.length,
        length: 1,
      });
      vEditor.deleteText({
        index: startIndex + annotatedText.length - 2,
        length: 2,
      });
      vEditor.deleteText({
        index: startIndex,
        length: 2,
      });

      vEditor.setVRange({
        index: startIndex + annotatedText.length - 4,
        length: 0,
      });

      return true;
    },
  },
  {
    name: 'italic',
    pattern: /(?:\*){1}([^* \n](.+?[^* \n])?)(?:\*){1}$/g,
    action: ({ vEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return false;
      }
      const annotatedText = match[0];
      const startIndex = vRange.index - annotatedText.length;

      vEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );

      undoManager.stopCapturing();

      vEditor.formatText(
        {
          index: startIndex,
          length: annotatedText.length,
        },
        {
          italic: true,
        }
      );

      vEditor.deleteText({
        index: startIndex + annotatedText.length,
        length: 1,
      });
      vEditor.deleteText({
        index: startIndex + annotatedText.length - 1,
        length: 1,
      });
      vEditor.deleteText({
        index: startIndex,
        length: 1,
      });

      vEditor.setVRange({
        index: startIndex + annotatedText.length - 2,
        length: 0,
      });

      return true;
    },
  },
  {
    name: 'strikethrough',
    pattern: /(?:~~)([^~ \n](.+?[^~ \n])?)(?:~~)$/g,
    action: ({ vEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return false;
      }
      const annotatedText = match[0];
      const startIndex = vRange.index - annotatedText.length;

      vEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );

      undoManager.stopCapturing();

      vEditor.formatText(
        {
          index: startIndex,
          length: annotatedText.length,
        },
        {
          strike: true,
        }
      );

      vEditor.deleteText({
        index: startIndex + annotatedText.length,
        length: 1,
      });
      vEditor.deleteText({
        index: startIndex + annotatedText.length - 2,
        length: 2,
      });
      vEditor.deleteText({
        index: startIndex,
        length: 2,
      });

      vEditor.setVRange({
        index: startIndex + annotatedText.length - 4,
        length: 0,
      });

      return true;
    },
  },
  {
    name: 'underthrough',
    pattern: /(?:~)([^~ \n](.+?[^~ \n])?)(?:~)$/g,
    action: ({ vEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return false;
      }
      const annotatedText = match[0];
      const startIndex = vRange.index - annotatedText.length;

      vEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );

      undoManager.stopCapturing();

      vEditor.formatText(
        {
          index: startIndex,
          length: annotatedText.length,
        },
        {
          underline: true,
        }
      );

      vEditor.deleteText({
        index: startIndex + annotatedText.length,
        length: 1,
      });
      vEditor.deleteText({
        index: vRange.index - 1,
        length: 1,
      });
      vEditor.deleteText({
        index: startIndex,
        length: 1,
      });

      vEditor.setVRange({
        index: startIndex + annotatedText.length - 2,
        length: 0,
      });

      return true;
    },
  },
  {
    name: 'code',
    pattern: /(?:`)(`{2,}?|[^`]+)(?:`)$/g,
    action: ({ vEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return false;
      }
      const annotatedText = match[0];
      const startIndex = vRange.index - annotatedText.length;

      if (prefixText.match(/^([* \n]+)$/g)) {
        return false;
      }

      vEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );

      undoManager.stopCapturing();

      vEditor.formatText(
        {
          index: startIndex,
          length: annotatedText.length,
        },
        {
          code: true,
        }
      );

      vEditor.deleteText({
        index: startIndex + annotatedText.length,
        length: 1,
      });
      vEditor.deleteText({
        index: startIndex + annotatedText.length - 1,
        length: 1,
      });
      vEditor.deleteText({
        index: startIndex,
        length: 1,
      });

      vEditor.setVRange({
        index: startIndex + annotatedText.length - 2,
        length: 0,
      });

      return true;
    },
  },
];
