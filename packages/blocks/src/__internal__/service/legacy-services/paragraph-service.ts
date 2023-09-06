import type { TextRangePoint } from '@blocksuite/block-std';

import type { ParagraphBlockModel } from '../../../paragraph-block/paragraph-model.js';
import type { SerializedBlock } from '../../index.js';
import type { BlockTransformContext } from '../../index.js';
import { json2block } from '../json2block.js';
import { BaseService } from '../service.js';

export class ParagraphBlockService extends BaseService<ParagraphBlockModel> {
  override async block2html(
    model: ParagraphBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ) {
    const text = await super.block2html(model, {
      childText: '',
      begin,
      end,
    });
    let resultText = '';
    switch (model.type) {
      case 'text':
        resultText = `<p>${text}</p>`;
        if (childText) {
          resultText = `${resultText}<div style="padding-left: 26px">${childText}</div>`;
        }
        break;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        resultText = `<${model.type}>${text}</${model.type}>`;
        if (childText) {
          resultText = `${resultText}<div style="padding-left: 26px">${childText}</div>`;
        }
        break;
      case 'quote':
        resultText = `<blockquote class="quote">${text}</blockquote>`;
        if (childText) {
          resultText = `<blockquote class="quote">${text}<div style="padding-left: 26px">${childText}</div></blockquote>`;
        }
        break;
      default:
        resultText = text;
    }
    return resultText;
  }

  override async block2markdown(
    model: ParagraphBlockModel,
    { begin, end }: BlockTransformContext = {}
  ) {
    const text = await super.block2markdown(model, {
      begin,
      end,
    });
    let resultText = '';
    switch (model.type) {
      case 'h1':
        resultText = `${'#'.repeat(1)} ${text}`;
        break;
      case 'h2':
        resultText = `${'#'.repeat(2)} ${text}`;
        break;
      case 'h3':
        resultText = `${'#'.repeat(3)} ${text}`;
        break;
      case 'h4':
        resultText = `${'#'.repeat(4)} ${text}`;
        break;
      case 'h5':
        resultText = `${'#'.repeat(5)} ${text}`;
        break;
      case 'h6':
        resultText = `${'#'.repeat(6)} ${text}`;
        break;
      case 'quote':
        resultText = text
          .split('\n')
          .reduce((preValue, curValue, index, array) => {
            if (curValue === '' && index === array.length - 1) {
              return preValue;
            }
            preValue += `${index !== 0 ? '\n' : ''}> ${curValue}${
              index < array.length - 1 ? '\n>' : ''
            }`;
            return preValue;
          }, '');
        break;
      default:
        resultText = text;
    }
    return resultText;
  }

  override async json2Block(
    focusedBlockModel: ParagraphBlockModel,
    pastedBlocks: SerializedBlock[],
    textRangePoint?: TextRangePoint
  ) {
    const convertToPastedIfEmpty = focusedBlockModel.type !== 'text';
    return json2block(focusedBlockModel, pastedBlocks, {
      textRangePoint,
      convertToPastedIfEmpty,
    });
  }
}

export default ParagraphBlockService;
