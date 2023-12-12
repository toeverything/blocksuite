/* eslint-disable no-useless-escape */
import type { Y } from '@blocksuite/store';
import {
  type InlineEditor,
  VKEYBOARD_ALLOW_DEFAULT,
  VKEYBOARD_PREVENT_DEFAULT,
  type VKeyboardBindingContext,
  type VKeyboardBindingHandler,
  type VRange,
} from '@blocksuite/virgo';

interface InlineMarkdownMatch {
  name: string;
  pattern: RegExp;
  action: (props: {
    inlineEditor: InlineEditor;
    prefixText: string;
    vRange: VRange;
    pattern: RegExp;
    undoManager: Y.UndoManager;
  }) => ReturnType<VKeyboardBindingHandler>;
}

// inline markdown match rules:
// covert: ***test*** + space
// covert: ***t est*** + space
// not convert: *** test*** + space
// not convert: ***test *** + space
// not convert: *** test *** + space
const inlineMarkdownMatches: InlineMarkdownMatch[] = [
  {
    name: 'bolditalic',
    pattern: /(?:\*\*\*)([^\s\*](?:[^*]*?[^\s\*])?)(?:\*\*\*)$/g,
    action: ({ inlineEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return VKEYBOARD_ALLOW_DEFAULT;
      }

      const annotatedText = match[0];
      const startIndex = vRange.index - annotatedText.length;

      inlineEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );
      inlineEditor.setVRange({
        index: startIndex + annotatedText.length + 1,
        length: 0,
      });

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

      inlineEditor.setVRange({
        index: startIndex + annotatedText.length - 6,
        length: 0,
      });

      return VKEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'bold',
    pattern: /(?:\*\*)([^\s\*](?:[^*]*?[^\s\*])?)(?:\*\*)$/g,
    action: ({ inlineEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return VKEYBOARD_ALLOW_DEFAULT;
      }
      const annotatedText = match[0];
      const startIndex = vRange.index - annotatedText.length;

      inlineEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );
      inlineEditor.setVRange({
        index: startIndex + annotatedText.length + 1,
        length: 0,
      });

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

      inlineEditor.setVRange({
        index: startIndex + annotatedText.length - 4,
        length: 0,
      });

      return VKEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'italic',
    pattern: /(?:\*)([^\s\*](?:[^*]*?[^\s\*])?)(?:\*)$/g,
    action: ({ inlineEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return VKEYBOARD_ALLOW_DEFAULT;
      }
      const annotatedText = match[0];
      const startIndex = vRange.index - annotatedText.length;

      inlineEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );
      inlineEditor.setVRange({
        index: startIndex + annotatedText.length + 1,
        length: 0,
      });

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

      inlineEditor.setVRange({
        index: startIndex + annotatedText.length - 2,
        length: 0,
      });

      return VKEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'strikethrough',
    pattern: /(?:~~)([^\s~](?:[^~]*?[^\s~])?)(?:~~)$/g,
    action: ({ inlineEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return VKEYBOARD_ALLOW_DEFAULT;
      }
      const annotatedText = match[0];
      const startIndex = vRange.index - annotatedText.length;

      inlineEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );
      inlineEditor.setVRange({
        index: startIndex + annotatedText.length + 1,
        length: 0,
      });

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

      inlineEditor.setVRange({
        index: startIndex + annotatedText.length - 4,
        length: 0,
      });

      return VKEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'underthrough',
    pattern: /(?:~)([^\s~](?:[^~]*?[^\s~])?)(?:~)$/g,
    action: ({ inlineEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return VKEYBOARD_ALLOW_DEFAULT;
      }
      const annotatedText = match[0];
      const startIndex = vRange.index - annotatedText.length;

      inlineEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );
      inlineEditor.setVRange({
        index: startIndex + annotatedText.length + 1,
        length: 0,
      });

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
        index: vRange.index - 1,
        length: 1,
      });
      inlineEditor.deleteText({
        index: startIndex,
        length: 1,
      });

      inlineEditor.setVRange({
        index: startIndex + annotatedText.length - 2,
        length: 0,
      });

      return VKEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'code',
    pattern: /(?:`)([^\s`](?:[^`]*?[^\s`])?)(?:`)$/g,
    action: ({ inlineEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return VKEYBOARD_ALLOW_DEFAULT;
      }
      const annotatedText = match[0];
      const startIndex = vRange.index - annotatedText.length;

      if (prefixText.match(/^([* \n]+)$/g)) {
        return VKEYBOARD_ALLOW_DEFAULT;
      }

      inlineEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );
      inlineEditor.setVRange({
        index: startIndex + annotatedText.length + 1,
        length: 0,
      });

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

      inlineEditor.setVRange({
        index: startIndex + annotatedText.length - 2,
        length: 0,
      });

      return VKEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'link',
    pattern: /(?:\[(.+?)\])(?:\((.+?)\))$/g,
    action: ({ inlineEditor, prefixText, vRange, pattern, undoManager }) => {
      const startIndex = prefixText.search(pattern);
      const matchedText = prefixText.match(pattern)?.[0];
      const hrefText = prefixText.match(/(?:\[(.*?)\])/g)?.[0];
      const hrefLink = prefixText.match(/(?:\((.*?)\))/g)?.[0];
      if (startIndex === -1 || !matchedText || !hrefText || !hrefLink) {
        return VKEYBOARD_ALLOW_DEFAULT;
      }
      const start = vRange.index - matchedText.length;

      inlineEditor.insertText(
        {
          index: vRange.index,
          length: 0,
        },
        ' '
      );
      inlineEditor.setVRange({
        index: vRange.index + 1,
        length: 0,
      });

      undoManager.stopCapturing();

      inlineEditor.formatText(
        {
          index: start,
          length: hrefText.length,
        },
        {
          link: hrefLink.slice(1, hrefLink.length - 1),
        }
      );

      inlineEditor.deleteText({
        index: vRange.index + matchedText.length,
        length: 1,
      });
      inlineEditor.deleteText({
        index: vRange.index - hrefLink.length - 1,
        length: hrefLink.length + 1,
      });
      inlineEditor.deleteText({
        index: start,
        length: 1,
      });

      inlineEditor.setVRange({
        index: start + hrefText.length - 1,
        length: 0,
      });

      return VKEYBOARD_PREVENT_DEFAULT;
    },
  },
];

/**
 * Returns true if markdown matches and converts to the appropriate format
 */
export function tryFormatInlineStyle(
  context: VKeyboardBindingContext,
  undoManager: Y.UndoManager
) {
  const { inlineEditor, prefixText, vRange } = context;
  for (const match of inlineMarkdownMatches) {
    const matchedText = prefixText.match(match.pattern);
    if (matchedText) {
      return match.action({
        inlineEditor,
        prefixText,
        vRange,
        pattern: match.pattern,
        undoManager,
      });
    }
  }

  return VKEYBOARD_ALLOW_DEFAULT;
}
