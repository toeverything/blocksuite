import { ALLOW_DEFAULT, PREVENT_DEFAULT } from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';

import { getCodeLanguage } from '../../code-block/utils/code-languages.js';
import {
  asyncSetVRange,
  convertToDivider,
  convertToList,
  convertToParagraph,
  type ExtendedModel,
} from '../utils/index.js';
import type { AffineVEditor } from './virgo/types.js';

type Match = {
  name: string;
  pattern: RegExp;
  action: (
    model: BaseBlockModel,
    vEditor: AffineVEditor,
    text: string,
    selection: VRange,
    pattern: RegExp
  ) => boolean;
};

const matches: Match[] = [
  {
    name: 'bolditalic',
    pattern: /(?:\*){3}(.+?)(?:\*){3}$/g,
    action: (
      model: BaseBlockModel,
      vEditor: AffineVEditor,
      text: string,
      selection: VRange,
      pattern: RegExp
    ) => {
      const match = pattern.exec(text);
      if (!match) {
        return false;
      }

      const annotatedText = match[0];
      const startIndex = selection.index - annotatedText.length;

      if (text.match(/^([* \n]+)$/g)) {
        return false;
      }

      vEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );

      model.page.captureSync();

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
    pattern: /(?:\*){2}(.+?)(?:\*){2}$/g,
    action: (
      model: BaseBlockModel,
      vEditor: AffineVEditor,
      text: string,
      selection: VRange,
      pattern: RegExp
    ) => {
      const match = pattern.exec(text);
      if (!match) {
        return false;
      }
      const annotatedText = match[0];
      const startIndex = selection.index - annotatedText.length;

      if (text.match(/^([* \n]+)$/g)) {
        return false;
      }

      vEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );
      model.page.captureSync();
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
    pattern: /(?:\*){1}(.+?)(?:\*){1}$/g,
    action: (
      model: BaseBlockModel,
      vEditor: AffineVEditor,
      text: string,
      selection: VRange,
      pattern: RegExp
    ) => {
      const match = pattern.exec(text);
      if (!match) {
        return false;
      }
      const annotatedText = match[0];
      const startIndex = selection.index - annotatedText.length;

      if (text.match(/^([* \n]+)$/g)) {
        return false;
      }

      vEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );
      model.page.captureSync();
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
    pattern: /(?:~~)(.+?)(?:~~)$/g,
    action: (
      model: BaseBlockModel,
      vEditor: AffineVEditor,
      text: string,
      selection: VRange,
      pattern: RegExp
    ) => {
      const match = pattern.exec(text);
      if (!match) {
        return false;
      }
      const annotatedText = match[0];
      const startIndex = selection.index - annotatedText.length;

      if (text.match(/^([* \n]+)$/g)) {
        return false;
      }

      vEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );
      model.page.captureSync();
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
    pattern: /(?:~)(.+?)(?:~)$/g,
    action: (
      model: BaseBlockModel,
      vEditor: AffineVEditor,
      text: string,
      selection: VRange,
      pattern: RegExp
    ) => {
      const match = pattern.exec(text);
      if (!match) {
        return false;
      }
      const annotatedText = match[0];
      const startIndex = selection.index - annotatedText.length;

      if (text.match(/^([* \n]+)$/g)) {
        return false;
      }

      vEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );
      model.page.captureSync();
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
        index: selection.index - 1,
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
    action: (
      model: BaseBlockModel,
      vEditor: AffineVEditor,
      text: string,
      selection: VRange,
      pattern: RegExp
    ) => {
      const match = pattern.exec(text);
      if (!match) {
        return false;
      }
      const annotatedText = match[0];
      const startIndex = selection.index - annotatedText.length;

      if (text.match(/^([* \n]+)$/g)) {
        return false;
      }

      vEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );
      model.page.captureSync();
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
    name: 'codeblock',
    pattern: /^```([a-zA-Z0-9]*)$/g,
    action: (
      model: BaseBlockModel,
      vEditor: AffineVEditor,
      text: string,
      selection: VRange,
      pattern: RegExp
    ) => {
      if (model.flavour === 'affine:paragraph' && model.type === 'quote') {
        return false;
      }
      const match = pattern.exec(text);
      const page = model.page;
      page.captureSync();
      const parent = page.getParent(model);
      assertExists(parent);
      const index = parent.children.indexOf(model);
      page.deleteBlock(model);

      const codeId = page.addBlock(
        'affine:code',
        { language: getCodeLanguage(match?.[1] || '') || 'Plain Text' },
        parent,
        index
      );

      const codeBlock = page.getBlockById(codeId);
      assertExists(codeBlock);
      asyncSetVRange(codeBlock, { index: 0, length: 0 });

      return true;
    },
  },
  {
    name: 'link',
    pattern:
      /(((https?|ftp|file):\/\/)|www.)[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]$/g,
    action: (
      model: BaseBlockModel,
      vEditor: AffineVEditor,
      text: string,
      selection: VRange,
      pattern: RegExp
    ) => {
      const match = pattern.exec(text);
      if (!match) {
        return false;
      }

      const annotatedText = match[0];
      const startIndex = selection.index - annotatedText.length;

      vEditor.insertText(
        {
          index: startIndex + annotatedText.length,
          length: 0,
        },
        ' '
      );
      model.page.captureSync();
      vEditor.formatText(
        {
          index: startIndex,
          length: annotatedText.length,
        },
        {
          link: annotatedText,
        }
      );

      vEditor.deleteText({
        index: startIndex + annotatedText.length,
        length: 1,
      });

      vEditor.setVRange({
        index: startIndex + annotatedText.length,
        length: 0,
      });

      return true;
    },
  },
  {
    name: 'link',
    pattern: /(?:\[(.+?)\])(?:\((.+?)\))$/g,
    action: (
      model: BaseBlockModel,
      vEditor: AffineVEditor,
      text: string,
      selection: VRange,
      pattern: RegExp
    ) => {
      const startIndex = text.search(pattern);
      const matchedText = text.match(pattern)?.[0];
      const hrefText = text.match(/(?:\[(.*?)\])/g)?.[0];
      const hrefLink = text.match(/(?:\((.*?)\))/g)?.[0];
      if (startIndex === -1 || !matchedText || !hrefText || !hrefLink) {
        return false;
      }
      const start = selection.index - matchedText.length;

      vEditor.insertText(
        {
          index: selection.index,
          length: 0,
        },
        ' '
      );
      model.page.captureSync();
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
        index: selection.index + matchedText.length,
        length: 1,
      });
      vEditor.deleteText({
        index: selection.index - hrefLink.length - 1,
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
export function markdownConvert(
  vEditor: AffineVEditor,
  model: BaseBlockModel,
  prefix: string
): boolean {
  const vRange = vEditor.getVRange();
  if (!vRange) {
    return false;
  }

  for (const match of matches) {
    const matchedText = prefix.match(match.pattern);
    if (matchedText) {
      return match.action(model, vEditor, prefix, vRange, match.pattern);
    }
  }
  return false;
}

export function tryMatchSpaceHotkey(
  page: Page,
  model: ExtendedModel,
  vEditor: AffineVEditor,
  prefix: string,
  range: { index: number; length: number }
) {
  const [, offset] = vEditor.getLine(range.index);
  if (offset > prefix.length) {
    return ALLOW_DEFAULT;
  }
  if (matchFlavours(model, ['affine:code'])) {
    return ALLOW_DEFAULT;
  }
  let isConverted = false;
  switch (prefix.trim()) {
    case '[]':
    case '[ ]':
      isConverted = convertToList(page, model, 'todo', prefix, {
        checked: false,
      });
      break;
    case '[x]':
      isConverted = convertToList(page, model, 'todo', prefix, {
        checked: true,
      });
      break;
    case '-':
    case '*':
      isConverted = convertToList(page, model, 'bulleted', prefix);
      break;
    case '***':
    case '---':
      isConverted = convertToDivider(page, model, prefix);
      break;
    case '#':
      isConverted = convertToParagraph(page, model, 'h1', prefix);
      break;
    case '##':
      isConverted = convertToParagraph(page, model, 'h2', prefix);
      break;
    case '###':
      isConverted = convertToParagraph(page, model, 'h3', prefix);
      break;
    case '####':
      isConverted = convertToParagraph(page, model, 'h4', prefix);
      break;
    case '#####':
      isConverted = convertToParagraph(page, model, 'h5', prefix);
      break;
    case '######':
      isConverted = convertToParagraph(page, model, 'h6', prefix);
      break;
    case '>':
      isConverted = convertToParagraph(page, model, 'quote', prefix);
      break;
    default:
      isConverted = convertToList(page, model, 'numbered', prefix);
  }

  return isConverted ? PREVENT_DEFAULT : ALLOW_DEFAULT;
}
