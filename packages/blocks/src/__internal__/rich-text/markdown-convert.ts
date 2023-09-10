/* eslint-disable no-useless-escape */
import { assertExists, isEqual } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import {
  type VEditor,
  VKEYBOARD_ALLOW_DEFAULT,
  VKEYBOARD_PREVENT_DEFAULT,
  type VKeyboardBindingContext,
  type VKeyboardBindingHandler,
  type VRange,
} from '@blocksuite/virgo';
import type * as Y from 'yjs';

import { getStandardLanguage } from '../../code-block/utils/code-languages.js';
import { FALLBACK_LANG } from '../../code-block/utils/consts.js';
import type { ParagraphBlockModel } from '../../paragraph-block/index.js';
import {
  asyncSetVRange,
  convertToDivider,
  convertToList,
  convertToParagraph,
  matchFlavours,
} from '../utils/index.js';
import type { AffineVEditor } from './virgo/types.js';

interface InlineMarkdownMatch {
  name: string;
  pattern: RegExp;
  action: (props: {
    vEditor: VEditor;
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
    action: ({ vEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return VKEYBOARD_ALLOW_DEFAULT;
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
      vEditor.setVRange({
        index: startIndex + annotatedText.length + 1,
        length: 0,
      });

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

      return VKEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'bold',
    pattern: /(?:\*\*)([^\s\*](?:[^*]*?[^\s\*])?)(?:\*\*)$/g,
    action: ({ vEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return VKEYBOARD_ALLOW_DEFAULT;
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
      vEditor.setVRange({
        index: startIndex + annotatedText.length + 1,
        length: 0,
      });

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

      return VKEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'italic',
    pattern: /(?:\*)([^\s\*](?:[^*]*?[^\s\*])?)(?:\*)$/g,
    action: ({ vEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return VKEYBOARD_ALLOW_DEFAULT;
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
      vEditor.setVRange({
        index: startIndex + annotatedText.length + 1,
        length: 0,
      });

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

      return VKEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'strikethrough',
    pattern: /(?:~~)([^\s~](?:[^~]*?[^\s~])?)(?:~~)$/g,
    action: ({ vEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return VKEYBOARD_ALLOW_DEFAULT;
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
      vEditor.setVRange({
        index: startIndex + annotatedText.length + 1,
        length: 0,
      });

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

      return VKEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'underthrough',
    pattern: /(?:~)([^\s~](?:[^~]*?[^\s~])?)(?:~)$/g,
    action: ({ vEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return VKEYBOARD_ALLOW_DEFAULT;
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
      vEditor.setVRange({
        index: startIndex + annotatedText.length + 1,
        length: 0,
      });

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

      return VKEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'code',
    pattern: /(?:`)([^\s`](?:[^`]*?[^\s`])?)(?:`)$/g,
    action: ({ vEditor, prefixText, vRange, pattern, undoManager }) => {
      const match = pattern.exec(prefixText);
      if (!match) {
        return VKEYBOARD_ALLOW_DEFAULT;
      }
      const annotatedText = match[0];
      const startIndex = vRange.index - annotatedText.length;

      if (prefixText.match(/^([* \n]+)$/g)) {
        return VKEYBOARD_ALLOW_DEFAULT;
      }

      vEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );
      vEditor.setVRange({
        index: startIndex + annotatedText.length + 1,
        length: 0,
      });

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

      return VKEYBOARD_PREVENT_DEFAULT;
    },
  },
  {
    name: 'link',
    pattern: /(?:\[(.+?)\])(?:\((.+?)\))$/g,
    action: ({ vEditor, prefixText, vRange, pattern, undoManager }) => {
      const startIndex = prefixText.search(pattern);
      const matchedText = prefixText.match(pattern)?.[0];
      const hrefText = prefixText.match(/(?:\[(.*?)\])/g)?.[0];
      const hrefLink = prefixText.match(/(?:\((.*?)\))/g)?.[0];
      if (startIndex === -1 || !matchedText || !hrefText || !hrefLink) {
        return VKEYBOARD_ALLOW_DEFAULT;
      }
      const start = vRange.index - matchedText.length;

      vEditor.insertText(
        {
          index: vRange.index,
          length: 0,
        },
        ' '
      );
      vEditor.setVRange({
        index: vRange.index + 1,
        length: 0,
      });

      undoManager.stopCapturing();

      vEditor.formatText(
        {
          index: start,
          length: hrefText.length,
        },
        {
          link: hrefLink.slice(1, hrefLink.length - 1),
        }
      );

      vEditor.deleteText({
        index: vRange.index + matchedText.length,
        length: 1,
      });
      vEditor.deleteText({
        index: vRange.index - hrefLink.length - 1,
        length: hrefLink.length + 1,
      });
      vEditor.deleteText({
        index: start,
        length: 1,
      });

      vEditor.setVRange({
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
  const { vEditor, prefixText, vRange } = context;
  for (const match of inlineMarkdownMatches) {
    const matchedText = prefixText.match(match.pattern);
    if (matchedText) {
      return match.action({
        vEditor,
        prefixText,
        vRange,
        pattern: match.pattern,
        undoManager,
      });
    }
  }

  return VKEYBOARD_ALLOW_DEFAULT;
}

export function tryConvertBlock(
  element: BlockElement,
  vEditor: AffineVEditor,
  prefixText: string,
  range: { index: number; length: number }
) {
  const { model } = element;
  if (
    !prefixText.match(
      /^(\d+\.|-|\*|\[ ?\]|\[x\]|(#){1,6}|(-){3}|(\*){3}|>|```([a-zA-Z0-9]*))$/
    )
  ) {
    return VKEYBOARD_ALLOW_DEFAULT;
  }

  const [, offset] = vEditor.getLine(range.index);
  if (offset > prefixText.length) {
    return VKEYBOARD_ALLOW_DEFAULT;
  }
  const isParagraph = matchFlavours(model, ['affine:paragraph']);
  const isHeading = isParagraph && model.type.startsWith('h');
  const isParagraphQuoteBlock = isParagraph && isEqual(model.type, 'quote');
  const isCodeBlock = matchFlavours(model, ['affine:code']);
  if (isHeading || isParagraphQuoteBlock || isCodeBlock) {
    return VKEYBOARD_ALLOW_DEFAULT;
  }

  // try to add code block
  const codeMatch = prefixText.match(/^```([a-zA-Z0-9]*)$/g);
  if (codeMatch) {
    if (
      model.flavour === 'affine:paragraph' &&
      (model as ParagraphBlockModel).type === 'quote'
    ) {
      return VKEYBOARD_ALLOW_DEFAULT;
    }

    const page = model.page;
    page.captureSync();
    const parent = page.getParent(model);
    assertExists(parent);
    const index = parent.children.indexOf(model);
    page.deleteBlock(model);

    const codeId = page.addBlock(
      'affine:code',
      {
        language:
          getStandardLanguage(codeMatch[0].slice(3))?.id ?? FALLBACK_LANG,
      },
      parent,
      index
    );

    const codeBlock = page.getBlockById(codeId);
    assertExists(codeBlock);
    asyncSetVRange(codeBlock, { index: 0, length: 0 });

    return VKEYBOARD_PREVENT_DEFAULT;
  }

  let isConverted = false;
  switch (prefixText.trim()) {
    case '[]':
    case '[ ]':
      isConverted = convertToList(element, 'todo', prefixText, {
        checked: false,
      });
      break;
    case '[x]':
      isConverted = convertToList(element, 'todo', prefixText, {
        checked: true,
      });
      break;
    case '-':
    case '*':
      isConverted = convertToList(element, 'bulleted', prefixText);
      break;
    case '***':
    case '---':
      isConverted = convertToDivider(element, prefixText);
      break;
    case '#':
      isConverted = convertToParagraph(element, 'h1', prefixText);
      break;
    case '##':
      isConverted = convertToParagraph(element, 'h2', prefixText);
      break;
    case '###':
      isConverted = convertToParagraph(element, 'h3', prefixText);
      break;
    case '####':
      isConverted = convertToParagraph(element, 'h4', prefixText);
      break;
    case '#####':
      isConverted = convertToParagraph(element, 'h5', prefixText);
      break;
    case '######':
      isConverted = convertToParagraph(element, 'h6', prefixText);
      break;
    case '>':
      isConverted = convertToParagraph(element, 'quote', prefixText);
      break;
    default:
      isConverted = convertToList(element, 'numbered', prefixText);
  }

  return isConverted ? VKEYBOARD_PREVENT_DEFAULT : VKEYBOARD_ALLOW_DEFAULT;
}
