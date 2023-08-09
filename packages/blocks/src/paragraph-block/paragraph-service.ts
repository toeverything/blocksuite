import type { TextRangePoint } from '@blocksuite/block-std';
import type { BaseBlockModel } from '@blocksuite/store';

import type { SerializedBlock } from '../__internal__/index.js';
import type { BlockTransformContext } from '../__internal__/index.js';
import { BaseService } from '../__internal__/service/index.js';
import { json2block } from '../__internal__/service/json2block.js';
import type { ParagraphBlockModel } from './paragraph-model.js';

export class ParagraphBlockService extends BaseService<ParagraphBlockModel> {
  override async block2html(
    model: ParagraphBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ) {
    const text = await super.block2html(model, {
      childText,
      begin,
      end,
    });
    switch (model.type) {
      case 'text':
        return `<p>${text}</p>`;
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return `<${model.type}>${text}</${model.type}>`;
      case 'quote':
        return `<blockquote class="quote">${text}</blockquote>`;
      default:
        return text;
    }
  }

  override async json2Block(
    focusedBlockModel: BaseBlockModel,
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
