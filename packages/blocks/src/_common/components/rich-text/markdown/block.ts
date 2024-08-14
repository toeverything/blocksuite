import type { AffineInlineEditor } from '@blocksuite/affine-components/rich-text';
import type { BlockComponent } from '@blocksuite/block-std';

import {
  isMarkdownPrefix,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';

import {
  convertToCodeBlock,
  convertToDivider,
  convertToList,
  convertToParagraph,
  getPrefixText,
} from './utils.js';

export function tryConvertBlock(
  element: BlockComponent,
  inline: AffineInlineEditor
) {
  const range = inline.getInlineRange();
  if (!range) return false;

  const prefixText = getPrefixText(inline);
  if (!isMarkdownPrefix(prefixText)) return false;

  const { model, std } = element;
  const isParagraph = matchFlavours(model, ['affine:paragraph']);
  const isHeading = isParagraph && model.type.startsWith('h');
  const isParagraphQuoteBlock = isParagraph && model.type === 'quote';
  const isCodeBlock = matchFlavours(model, ['affine:code']);
  if (isHeading || isParagraphQuoteBlock || isCodeBlock) {
    return false;
  }

  const lineInfo = inline.getLine(range.index);
  if (!lineInfo) return false;

  const { lineIndex, rangeIndexRelatedToLine } = lineInfo;
  if (lineIndex !== 0 || rangeIndexRelatedToLine > prefixText.length) {
    return false;
  }

  // try to add code block
  const codeMatch = prefixText.match(/^```([a-zA-Z0-9]*)$/g);
  if (codeMatch) {
    return convertToCodeBlock(std, model, prefixText, codeMatch[0].slice(3));
  }

  switch (prefixText.trim()) {
    case '[]':
    case '[ ]':
      return convertToList(std, model, 'todo', prefixText, {
        checked: false,
      });
    case '[x]':
      return convertToList(std, model, 'todo', prefixText, {
        checked: true,
      });
    case '-':
    case '*':
      return convertToList(std, model, 'bulleted', prefixText);
    case '***':
    case '---':
      return convertToDivider(std, model, prefixText);
    case '#':
      return convertToParagraph(std, model, 'h1', prefixText);
    case '##':
      return convertToParagraph(std, model, 'h2', prefixText);
    case '###':
      return convertToParagraph(std, model, 'h3', prefixText);
    case '####':
      return convertToParagraph(std, model, 'h4', prefixText);
    case '#####':
      return convertToParagraph(std, model, 'h5', prefixText);
    case '######':
      return convertToParagraph(std, model, 'h6', prefixText);
    case '>':
      return convertToParagraph(std, model, 'quote', prefixText);
    default:
      return convertToList(std, model, 'numbered', prefixText);
  }
}
