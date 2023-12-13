import {
  type InlineEditor,
  type InlineRange,
  KEYBOARD_ALLOW_DEFAULT,
  KEYBOARD_PREVENT_DEFAULT,
} from '@blocksuite/inline';
import type * as Y from 'yjs';

interface MarkdownMatch {
  name: string;
  pattern: RegExp;
  action: (props: {
    inlineEditor: InlineEditor;
    prefixText: string;
    inlineRange: InlineRange;
    pattern: RegExp;
    undoManager: Y.UndoManager;
  }) => boolean;
}

export const markdownMatches: MarkdownMatch[] = [
  {
    name: 'bolditalic',
    pattern: /(?:\*){3}([^* \n](.+?[^* \n])?)(?:\*){3}$/g,
    action: ({
      inlineEditor,
      prefixText,
      inlineRange,
      pattern,
      undoManager,
    }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return KEYBOARD_ALLOW_DEFAULT;
      }

      const annotatedText = match[0];
      const startIndex = inlineRange.index - annotatedText.length;

      inlineEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );

      undoManager.stopCapturing();

      inlineEditor.formatText(
        {
          index: startIndex,
          length: annotatedText.length,
        },
        {
          bold: true,
          italic: true,
        }
      );

      inlineEditor.deleteText({
        index: startIndex + annotatedText.length,
        length: 1,
      });
      inlineEditor.deleteText({
        index: startIndex + annotatedText.length - 3,
        length: 3,
      });
      inlineEditor.deleteText({
        index: startIndex,
        length: 3,
      });

      inlineEditor.setInlineRange({
        index: startIndex + annotatedText.length - 6,
        length: 0,
      });

      return KEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'bold',
    pattern: /(?:\*){2}([^* \n](.+?[^* \n])?)(?:\*){2}$/g,
    action: ({
      inlineEditor,
      prefixText,
      inlineRange,
      pattern,
      undoManager,
    }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return KEYBOARD_ALLOW_DEFAULT;
      }
      const annotatedText = match[0];
      const startIndex = inlineRange.index - annotatedText.length;

      inlineEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );

      undoManager.stopCapturing();

      inlineEditor.formatText(
        {
          index: startIndex,
          length: annotatedText.length,
        },
        {
          bold: true,
        }
      );

      inlineEditor.deleteText({
        index: startIndex + annotatedText.length,
        length: 1,
      });
      inlineEditor.deleteText({
        index: startIndex + annotatedText.length - 2,
        length: 2,
      });
      inlineEditor.deleteText({
        index: startIndex,
        length: 2,
      });

      inlineEditor.setInlineRange({
        index: startIndex + annotatedText.length - 4,
        length: 0,
      });

      return KEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'italic',
    pattern: /(?:\*){1}([^* \n](.+?[^* \n])?)(?:\*){1}$/g,
    action: ({
      inlineEditor,
      prefixText,
      inlineRange,
      pattern,
      undoManager,
    }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return KEYBOARD_ALLOW_DEFAULT;
      }
      const annotatedText = match[0];
      const startIndex = inlineRange.index - annotatedText.length;

      inlineEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );

      undoManager.stopCapturing();

      inlineEditor.formatText(
        {
          index: startIndex,
          length: annotatedText.length,
        },
        {
          italic: true,
        }
      );

      inlineEditor.deleteText({
        index: startIndex + annotatedText.length,
        length: 1,
      });
      inlineEditor.deleteText({
        index: startIndex + annotatedText.length - 1,
        length: 1,
      });
      inlineEditor.deleteText({
        index: startIndex,
        length: 1,
      });

      inlineEditor.setInlineRange({
        index: startIndex + annotatedText.length - 2,
        length: 0,
      });

      return KEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'strikethrough',
    pattern: /(?:~~)([^~ \n](.+?[^~ \n])?)(?:~~)$/g,
    action: ({
      inlineEditor,
      prefixText,
      inlineRange,
      pattern,
      undoManager,
    }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return KEYBOARD_ALLOW_DEFAULT;
      }
      const annotatedText = match[0];
      const startIndex = inlineRange.index - annotatedText.length;

      inlineEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );

      undoManager.stopCapturing();

      inlineEditor.formatText(
        {
          index: startIndex,
          length: annotatedText.length,
        },
        {
          strike: true,
        }
      );

      inlineEditor.deleteText({
        index: startIndex + annotatedText.length,
        length: 1,
      });
      inlineEditor.deleteText({
        index: startIndex + annotatedText.length - 2,
        length: 2,
      });
      inlineEditor.deleteText({
        index: startIndex,
        length: 2,
      });

      inlineEditor.setInlineRange({
        index: startIndex + annotatedText.length - 4,
        length: 0,
      });

      return KEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'underthrough',
    pattern: /(?:~)([^~ \n](.+?[^~ \n])?)(?:~)$/g,
    action: ({
      inlineEditor,
      prefixText,
      inlineRange,
      pattern,
      undoManager,
    }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return KEYBOARD_ALLOW_DEFAULT;
      }
      const annotatedText = match[0];
      const startIndex = inlineRange.index - annotatedText.length;

      inlineEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );

      undoManager.stopCapturing();

      inlineEditor.formatText(
        {
          index: startIndex,
          length: annotatedText.length,
        },
        {
          underline: true,
        }
      );

      inlineEditor.deleteText({
        index: startIndex + annotatedText.length,
        length: 1,
      });
      inlineEditor.deleteText({
        index: inlineRange.index - 1,
        length: 1,
      });
      inlineEditor.deleteText({
        index: startIndex,
        length: 1,
      });

      inlineEditor.setInlineRange({
        index: startIndex + annotatedText.length - 2,
        length: 0,
      });

      return KEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'code',
    pattern: /(?:`)(`{2,}?|[^`]+)(?:`)$/g,
    action: ({
      inlineEditor,
      prefixText,
      inlineRange,
      pattern,
      undoManager,
    }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return KEYBOARD_ALLOW_DEFAULT;
      }
      const annotatedText = match[0];
      const startIndex = inlineRange.index - annotatedText.length;

      if (prefixText.match(/^([* \n]+)$/g)) {
        return KEYBOARD_ALLOW_DEFAULT;
      }

      inlineEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );

      undoManager.stopCapturing();

      inlineEditor.formatText(
        {
          index: startIndex,
          length: annotatedText.length,
        },
        {
          code: true,
        }
      );

      inlineEditor.deleteText({
        index: startIndex + annotatedText.length,
        length: 1,
      });
      inlineEditor.deleteText({
        index: startIndex + annotatedText.length - 1,
        length: 1,
      });
      inlineEditor.deleteText({
        index: startIndex,
        length: 1,
      });

      inlineEditor.setInlineRange({
        index: startIndex + annotatedText.length - 2,
        length: 0,
      });

      return KEYBOARD_PREVENT_DEFAULT;
    },
  },
];
