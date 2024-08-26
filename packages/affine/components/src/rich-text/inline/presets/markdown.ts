/* eslint-disable no-useless-escape */

import {
  KEYBOARD_ALLOW_DEFAULT,
  KEYBOARD_PREVENT_DEFAULT,
} from '@blocksuite/inline';

import type { InlineMarkdownMatch } from '../inline-manager.js';
import type { AffineTextAttributes } from './affine-inline-specs.js';

// inline markdown match rules:
// covert: ***test*** + space
// covert: ***t est*** + space
// not convert: *** test*** + space
// not convert: ***test *** + space
// not convert: *** test *** + space
export const affineInlineMarkdownMatches: InlineMarkdownMatch<AffineTextAttributes>[] =
  [
    {
      name: 'bolditalic',
      pattern: /(?:\*\*\*)([^\s\*](?:[^*]*?[^\s\*])?)(?:\*\*\*)$/g,
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
        inlineEditor.setInlineRange({
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

        inlineEditor.setInlineRange({
          index: startIndex + annotatedText.length - 6,
          length: 0,
        });

        return KEYBOARD_PREVENT_DEFAULT;
      },
    },
    {
      name: 'bold',
      pattern: /(?:\*\*)([^\s\*](?:[^*]*?[^\s\*])?)(?:\*\*)$/g,
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
        inlineEditor.setInlineRange({
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

        inlineEditor.setInlineRange({
          index: startIndex + annotatedText.length - 4,
          length: 0,
        });

        return KEYBOARD_PREVENT_DEFAULT;
      },
    },
    {
      name: 'italic',
      pattern: /(?:\*)([^\s\*](?:[^*]*?[^\s\*])?)(?:\*)$/g,
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
        inlineEditor.setInlineRange({
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

        inlineEditor.setInlineRange({
          index: startIndex + annotatedText.length - 2,
          length: 0,
        });

        return KEYBOARD_PREVENT_DEFAULT;
      },
    },
    {
      name: 'strikethrough',
      pattern: /(?:~~)([^\s~](?:[^~]*?[^\s~])?)(?:~~)$/g,
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
        inlineEditor.setInlineRange({
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

        inlineEditor.setInlineRange({
          index: startIndex + annotatedText.length - 4,
          length: 0,
        });

        return KEYBOARD_PREVENT_DEFAULT;
      },
    },
    {
      name: 'underthrough',
      pattern: /(?:~)([^\s~](?:[^~]*?[^\s~])?)(?:~)$/g,
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
        inlineEditor.setInlineRange({
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
      pattern: /(?:`)([^\s`](?:[^`]*?[^\s`])?)(?:`)$/g,
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
        inlineEditor.setInlineRange({
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

        inlineEditor.setInlineRange({
          index: startIndex + annotatedText.length - 2,
          length: 0,
        });

        return KEYBOARD_PREVENT_DEFAULT;
      },
    },
    {
      name: 'link',
      pattern: /(?:\[(.+?)\])(?:\((.+?)\))$/g,
      action: ({
        inlineEditor,
        prefixText,
        inlineRange,
        pattern,
        undoManager,
      }) => {
        const startIndex = prefixText.search(pattern);
        const matchedText = prefixText.match(pattern)?.[0];
        const hrefText = prefixText.match(/(?:\[(.*?)\])/g)?.[0];
        const hrefLink = prefixText.match(/(?:\((.*?)\))/g)?.[0];
        if (startIndex === -1 || !matchedText || !hrefText || !hrefLink) {
          return KEYBOARD_ALLOW_DEFAULT;
        }
        const start = inlineRange.index - matchedText.length;

        inlineEditor.insertText(
          {
            index: inlineRange.index,
            length: 0,
          },
          ' '
        );
        inlineEditor.setInlineRange({
          index: inlineRange.index + 1,
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
          index: inlineRange.index + matchedText.length,
          length: 1,
        });
        inlineEditor.deleteText({
          index: inlineRange.index - hrefLink.length - 1,
          length: hrefLink.length + 1,
        });
        inlineEditor.deleteText({
          index: start,
          length: 1,
        });

        inlineEditor.setInlineRange({
          index: start + hrefText.length - 1,
          length: 0,
        });

        return KEYBOARD_PREVENT_DEFAULT;
      },
    },
  ];
