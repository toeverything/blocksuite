import { ALLOW_DEFAULT, PREVENT_DEFAULT } from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import type { Quill, RangeStatic } from 'quill';

import { getCodeLaguage } from '../../code-block/utils/code-laguages.js';
import {
  convertToDivider,
  convertToList,
  convertToParagraph,
  ExtendedModel,
} from '../utils/index.js';

type Match = {
  name: string;
  pattern: RegExp;
  action: (
    model: BaseBlockModel,
    quill: Quill,
    text: string,
    selection: RangeStatic,
    pattern: RegExp
  ) => boolean;
};

const IGNORE_TAGS: string[] = ['PRE'];

function isValid(text: string, tagName: string) {
  return (
    typeof text !== 'undefined' && text && IGNORE_TAGS.indexOf(tagName) === -1
  );
}

const matches: Match[] = [
  {
    name: 'bolditalic',
    pattern: /(?:\*){3}(.+?)(?:\*){3}$/g,
    action: (
      model: BaseBlockModel,
      quill: Quill,
      text: string,
      selection: RangeStatic,
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

      model.text?.insert(' ', startIndex + annotatedText.length);
      model.page.captureSync();
      model.text?.format(startIndex, annotatedText.length, {
        bold: true,
        italic: true,
      });
      quill.setSelection(startIndex + annotatedText.length + 1, 0);

      model.text?.delete(startIndex + annotatedText.length, 1);
      model.text?.delete(startIndex + annotatedText.length - 3, 3);
      model.text?.delete(startIndex, 3);
      quill.format('bold', false);
      quill.format('italic', false);

      return true;
    },
  },
  {
    name: 'bold',
    pattern: /(?:\*){2}(.+?)(?:\*){2}$/g,
    action: (
      model: BaseBlockModel,
      quill: Quill,
      text: string,
      selection: RangeStatic,
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
      model.text?.insert(' ', startIndex + annotatedText.length);
      model.page.captureSync();
      model.text?.format(startIndex, annotatedText.length, {
        bold: true,
      });
      quill.setSelection(startIndex + annotatedText.length + 1, 0);

      model.text?.delete(startIndex + annotatedText.length, 1);
      model.text?.delete(startIndex + annotatedText.length - 2, 2);
      model.text?.delete(startIndex, 2);
      quill.format('bold', false);

      return true;
    },
  },
  {
    name: 'italic',
    pattern: /(?:\*){1}(.+?)(?:\*){1}$/g,
    action: (
      model: BaseBlockModel,
      quill: Quill,
      text: string,
      selection: RangeStatic,
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

      model.text?.insert(' ', startIndex + annotatedText.length);
      model.page.captureSync();
      model.text?.format(startIndex, annotatedText.length, {
        italic: true,
      });
      quill.setSelection(startIndex + annotatedText.length + 1, 0);

      model.text?.delete(startIndex + annotatedText.length, 1);
      model.text?.delete(startIndex + annotatedText.length - 1, 1);
      model.text?.delete(startIndex, 1);
      quill.format('italic', false);

      return true;
    },
  },
  {
    name: 'strikethrough',
    pattern: /(?:~~)(.+?)(?:~~)$/g,
    action: (
      model: BaseBlockModel,
      quill: Quill,
      text: string,
      selection: RangeStatic,
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

      model.text?.insert(' ', startIndex + annotatedText.length);
      model.page.captureSync();
      model.text?.format(startIndex, annotatedText.length, {
        strike: true,
      });
      quill.setSelection(startIndex + annotatedText.length + 1, 0);

      model.text?.delete(startIndex + annotatedText.length, 1);
      model.text?.delete(startIndex + annotatedText.length - 2, 2);
      model.text?.delete(startIndex, 2);
      quill.format('strike', false);

      return true;
    },
  },
  {
    name: 'underthrough',
    pattern: /(?:~)(.+?)(?:~)$/g,
    action: (
      model: BaseBlockModel,
      quill: Quill,
      text: string,
      selection: RangeStatic,
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

      model.text?.insert(' ', selection.index);
      model.page.captureSync();
      model.text?.format(startIndex, annotatedText.length, {
        underline: true,
      });
      quill.setSelection(startIndex + annotatedText.length + 1, 0);

      model.text?.delete(startIndex + annotatedText.length, 1);
      model.text?.delete(selection.index - 1, 1);
      model.text?.delete(startIndex, 1);
      quill.format('underline', false);

      return true;
    },
  },
  {
    name: 'code',
    pattern: /(?:`)(`{2,}?|[^`]+)(?:`)$/g,
    action: (
      model: BaseBlockModel,
      quill: Quill,
      text: string,
      selection: RangeStatic,
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

      model.text?.insert(' ', startIndex + annotatedText.length);
      model.page.captureSync();
      model.text?.format(startIndex, annotatedText.length, {
        code: true,
      });

      quill.setSelection(startIndex + annotatedText.length + 1, 0);
      model.text?.delete(startIndex + annotatedText.length, 1);
      model.text?.delete(startIndex + annotatedText.length - 1, 1);
      model.text?.delete(startIndex, 1);
      quill.format('code', false);

      return true;
    },
  },
  {
    name: 'codeblock',
    pattern: /^```([a-zA-Z0-9]*)$/g,
    action: (
      model: BaseBlockModel,
      quill: Quill,
      text: string,
      selection: RangeStatic,
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
      page.addBlockByFlavour(
        'affine:code',
        { language: getCodeLaguage(match?.[1] || '') || 'JavaScript' },
        parent,
        index
      );
      return true;
    },
  },
  {
    name: 'link',
    pattern:
      /(((https?|ftp|file):\/\/)|www.)[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]$/g,
    action: (
      model: BaseBlockModel,
      quill: Quill,
      text: string,
      selection: RangeStatic,
      pattern: RegExp
    ) => {
      const match = pattern.exec(text);
      if (!match) {
        return false;
      }

      const annotatedText = match[0];
      const startIndex = selection.index - annotatedText.length;

      model.text?.insert(' ', startIndex + annotatedText.length);
      model.page.captureSync();
      model.text?.format(startIndex, annotatedText.length, {
        link: annotatedText,
      });
      quill.setSelection(startIndex + annotatedText.length + 1, 0);

      model.text?.delete(startIndex + annotatedText.length, 1);
      quill.format('link', false);

      return true;
    },
  },
  {
    name: 'link',
    pattern: /(?:\[(.+?)\])(?:\((.+?)\))$/g,
    action: (
      model: BaseBlockModel,
      quill: Quill,
      text: string,
      selection: RangeStatic,
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

      model.text?.insert(' ', selection.index);
      model.page.captureSync();
      model.text?.format(start, hrefText.length, {
        link: hrefLink.slice(1, hrefLink.length - 1),
      });
      quill.setSelection(startIndex + matchedText.length + 1, 0);

      model.text?.delete(startIndex + matchedText.length, 1);
      model.text?.delete(
        selection.index - hrefLink.length - 1,
        hrefLink.length + 1
      );
      model.text?.delete(start, 1);
      quill.format('link', false);

      return true;
    },
  },
];

/**
 * Returns true if markdown matches and converts to the appropriate format
 */
export function markdownConvert(
  quill: Quill,
  model: BaseBlockModel,
  prefix: string
): boolean {
  const selection = quill.getSelection();
  if (!selection) {
    return false;
  }
  const [line] = quill.getLine(selection.index);
  if (isValid(prefix, line.domNode.tagName)) {
    for (const match of matches) {
      const matchedText = prefix.match(match.pattern);
      if (matchedText) {
        return match.action(model, quill, prefix, selection, match.pattern);
      }
    }
  }
  return false;
}

export function tryMatchSpaceHotkey(
  page: Page,
  model: ExtendedModel,
  quill: Quill,
  prefix: string,
  range: { index: number; length: number }
) {
  const [, offset] = quill.getLine(range.index);
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
