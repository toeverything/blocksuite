import type { TextRangePoint } from '@blocksuite/block-std';
import type { BaseBlockModel } from '@blocksuite/store';

import type { ListBlockModel } from '../../../list-block/list-model.js';
import type { BlockTransformContext } from '../../index.js';
import type { SerializedBlock } from '../../index.js';
import { json2block } from '../json2block.js';
import { BaseService } from '../service.js';

export class ListBlockService extends BaseService<ListBlockModel> {
  override async block2html(
    block: ListBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ) {
    let text = await super.block2html(block, {
      childText,
      begin,
      end,
    });
    const previousSiblingBlock = block.page.getPreviousSibling(block);
    const nextSiblingBlock = block.page.getNextSibling(block);
    switch (block.type) {
      case 'bulleted':
      case 'toggle':
        text = `<li>${text}</li>`;
        break;
      case 'numbered':
        text = `<li>${text}</li>`;
        break;
      case 'todo':
        text = `<li><input disabled type="checkbox" ${
          block.checked ? 'checked' : ''
        }>${text}</li>`;
        break;
      default:
        break;
    }
    if (
      previousSiblingBlock?.flavour !== block.flavour ||
      (previousSiblingBlock as ListBlockModel).type !== block.type
    ) {
      switch (block.type) {
        case 'bulleted':
        case 'toggle':
        case 'todo':
          text = `<ul>${text}`;
          break;
        case 'numbered':
          text = `<ol>${text}`;
          break;
        default:
          break;
      }
    }
    if (
      nextSiblingBlock?.flavour !== block.flavour ||
      (nextSiblingBlock as ListBlockModel).type !== block.type
    ) {
      switch (block.type) {
        case 'bulleted':
        case 'toggle':
        case 'todo':
          text = `${text}</ul>`;
          break;
        case 'numbered':
          text = `${text}</ol>`;
          break;
        default:
          break;
      }
    }
    return text;
  }

  override async block2markdown(
    block: ListBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ) {
    let text = await super.block2markdown(block, {
      childText,
      begin,
      end,
    });
    const previousSiblingBlock = block.page.getPreviousSibling(block);
    switch (block.type) {
      case 'bulleted':
      case 'toggle':
        text = `* ${text}`;
        break;
      case 'numbered':
        text = `1. ${text}`;
        break;
      case 'todo':
        text = `* [${block.checked ? 'x' : ' '}] ${text}`;
        break;
      default:
        break;
    }
    if (
      previousSiblingBlock?.flavour !== block.flavour ||
      (previousSiblingBlock as ListBlockModel).type !== block.type
    ) {
      switch (block.type) {
        case 'bulleted':
        case 'toggle':
        case 'todo':
          text = `* ${text}`;
          break;
        case 'numbered':
          text = `1. ${text}`;
          break;
        default:
          break;
      }
    }
    return text;
  }

  override async json2Block(
    focusedBlockModel: BaseBlockModel,
    pastedBlocks: SerializedBlock[],
    textRangePoint?: TextRangePoint
  ) {
    const convertToPastedIfEmpty = pastedBlocks[0].flavour !== 'affine:list';
    return json2block(focusedBlockModel, pastedBlocks, {
      textRangePoint,
      convertToPastedIfEmpty,
    });
  }
}
