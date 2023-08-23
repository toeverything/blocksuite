import { assertExists, isEqual } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';
import type {
  VEditor,
  VKeyboardBindingContext,
  VRange,
} from '@blocksuite/virgo';
import type * as Y from 'yjs';

import { getStandardLanguage } from '../../code-block/utils/code-languages.js';
import { FALLBACK_LANG } from '../../code-block/utils/consts.js';
import type { ParagraphBlockModel } from '../../paragraph-block/index.js';
import { ALLOW_DEFAULT, PREVENT_DEFAULT } from '../consts.js';
import {
  asyncSetVRange,
  convertToDivider,
  convertToList,
  convertToParagraph,
  type ExtendedModel,
  matchFlavours,
} from '../utils/index.js';
import type { AffineVEditor } from './virgo/types.js';

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

const markdownMatches: MarkdownMatch[] = [
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
  {
    name: 'link',
    pattern: /(?:\[(.+?)\])(?:\((.+?)\))$/g,
    action: ({ vEditor, prefixText, vRange, pattern, undoManager }) => {
      const startIndex = prefixText.search(pattern);
      const matchedText = prefixText.match(pattern)?.[0];
      const hrefText = prefixText.match(/(?:\[(.*?)\])/g)?.[0];
      const hrefLink = prefixText.match(/(?:\((.*?)\))/g)?.[0];
      if (startIndex === -1 || !matchedText || !hrefText || !hrefLink) {
        return false;
      }
      const start = vRange.index - matchedText.length;

      vEditor.insertText(
        {
          index: vRange.index,
          length: 0,
        },
        ' '
      );

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

      return true;
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
  for (const match of markdownMatches) {
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

  return false;
}

export function tryConvertBlock(
  page: Page,
  model: ExtendedModel,
  vEditor: AffineVEditor,
  prefixText: string,
  range: { index: number; length: number }
) {
  const [, offset] = vEditor.getLine(range.index);
  if (offset > prefixText.length) {
    return ALLOW_DEFAULT;
  }
  const isParagraph = matchFlavours(model, ['affine:paragraph']);
  const isHeading = isParagraph && model.type.startsWith('h');
  const isParagraphQuoteBlock = isParagraph && isEqual(model.type, 'quote');
  const isCodeBlock = matchFlavours(model, ['affine:code']);
  if (isHeading || isParagraphQuoteBlock || isCodeBlock) {
    return ALLOW_DEFAULT;
  }

  // try to add code block
  const codeMatches = prefixText.match(/^```([a-zA-Z0-9]*)$/g);
  if (codeMatches) {
    if (
      model.flavour === 'affine:paragraph' &&
      (model as ParagraphBlockModel).type === 'quote'
    ) {
      return ALLOW_DEFAULT;
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
          getStandardLanguage(codeMatches?.[1] ?? '')?.id ?? FALLBACK_LANG,
      },
      parent,
      index
    );

    const codeBlock = page.getBlockById(codeId);
    assertExists(codeBlock);
    asyncSetVRange(codeBlock, { index: 0, length: 0 });

    return PREVENT_DEFAULT;
  }

  let isConverted = false;
  switch (prefixText.trim()) {
    case '[]':
    case '[ ]':
      isConverted = convertToList(page, model, 'todo', prefixText, {
        checked: false,
      });
      break;
    case '[x]':
      isConverted = convertToList(page, model, 'todo', prefixText, {
        checked: true,
      });
      break;
    case '-':
    case '*':
      isConverted = convertToList(page, model, 'bulleted', prefixText);
      break;
    case '***':
    case '---':
      isConverted = convertToDivider(page, model, prefixText);
      break;
    case '#':
      isConverted = convertToParagraph(page, model, 'h1', prefixText);
      break;
    case '##':
      isConverted = convertToParagraph(page, model, 'h2', prefixText);
      break;
    case '###':
      isConverted = convertToParagraph(page, model, 'h3', prefixText);
      break;
    case '####':
      isConverted = convertToParagraph(page, model, 'h4', prefixText);
      break;
    case '#####':
      isConverted = convertToParagraph(page, model, 'h5', prefixText);
      break;
    case '######':
      isConverted = convertToParagraph(page, model, 'h6', prefixText);
      break;
    case '>':
      isConverted = convertToParagraph(page, model, 'quote', prefixText);
      break;
    default:
      isConverted = convertToList(page, model, 'numbered', prefixText);
  }

  return isConverted ? PREVENT_DEFAULT : ALLOW_DEFAULT;
}
