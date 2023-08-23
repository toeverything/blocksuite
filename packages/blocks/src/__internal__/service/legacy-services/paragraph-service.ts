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
        break;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        resultText = `<${model.type}>${text}</${model.type}>`;
        break;
      case 'quote':
        resultText = `<blockquote class="quote">${text}</blockquote>`;
        break;
      default:
        resultText = text;
    }
    if (childText) {
      resultText = `${resultText}<div style="padding-left: 26px">${childText}</div>`;
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
