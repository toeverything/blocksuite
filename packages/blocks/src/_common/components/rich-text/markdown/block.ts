import type { BlockElement } from '@blocksuite/block-std';
import { assertExists, isEqual } from '@blocksuite/global/utils';
import {
  KEYBOARD_ALLOW_DEFAULT,
  KEYBOARD_PREVENT_DEFAULT,
} from '@blocksuite/inline';

import {
  asyncSetInlineRange,
  matchFlavours,
} from '../../../../_common/utils/index.js';
import { getStandardLanguage } from '../../../../code-block/utils/code-languages.js';
import { FALLBACK_LANG } from '../../../../code-block/utils/consts.js';
import type { ParagraphBlockModel } from '../../../../paragraph-block/index.js';
import type { AffineInlineEditor } from '../../../inline/presets/affine-inline-specs.js';
import {
  convertToDivider,
  convertToList,
  convertToParagraph,
} from './utils.js';

export function tryConvertBlock(
  element: BlockElement,
  inline: AffineInlineEditor,
  prefixText: string,
  range: { index: number; length: number }
) {
  const { model } = element;
  if (
    !prefixText.match(
      /^(\d+\.|-|\*|\[ ?\]|\[x\]|(#){1,6}|(-){3}|(\*){3}|>|```([a-zA-Z0-9]*))$/
    )
  ) {
    return KEYBOARD_ALLOW_DEFAULT;
  }

  const [, offset] = inline.getLine(range.index);
  if (offset > prefixText.length) {
    return KEYBOARD_ALLOW_DEFAULT;
  }
  const isParagraph = matchFlavours(model, ['affine:paragraph']);
  const isHeading = isParagraph && model.type.startsWith('h');
  const isParagraphQuoteBlock = isParagraph && isEqual(model.type, 'quote');
  const isCodeBlock = matchFlavours(model, ['affine:code']);
  if (isHeading || isParagraphQuoteBlock || isCodeBlock) {
    return KEYBOARD_ALLOW_DEFAULT;
  }

  // try to add code block
  const codeMatch = prefixText.match(/^```([a-zA-Z0-9]*)$/g);
  if (codeMatch) {
    if (
      model.flavour === 'affine:paragraph' &&
      (model as ParagraphBlockModel).type === 'quote'
    ) {
      return KEYBOARD_ALLOW_DEFAULT;
    }

    const doc = model.doc;
    doc.captureSync();

    const parent = doc.getParent(model);
    assertExists(parent);
    const index = parent.children.indexOf(model);

    const codeId = doc.addBlock(
      'affine:code',
      {
        language:
          getStandardLanguage(codeMatch[0].slice(3))?.id ?? FALLBACK_LANG,
      },
      parent,
      index
    );
    if (model.text && model.text.length > prefixText.length) {
      const text = model.text.clone();
      doc.addBlock('affine:paragraph', { text }, parent, index + 1);
      text.delete(0, prefixText.length);
    }
    doc.deleteBlock(model, {
      bringChildrenTo: parent,
    });

    const codeBlock = doc.getBlockById(codeId);
    assertExists(codeBlock);
    asyncSetInlineRange(element.host, codeBlock, { index: 0, length: 0 }).catch(
      console.error
    );

    return KEYBOARD_PREVENT_DEFAULT;
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

  return isConverted ? KEYBOARD_PREVENT_DEFAULT : KEYBOARD_ALLOW_DEFAULT;
}
