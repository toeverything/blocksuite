import type { BaseBlockModel } from '@blocksuite/store';

import type { BlockTransformContext } from '../__internal__/index.js';
import type { BlockRange, SerializedBlock } from '../__internal__/index.js';
import { BaseService } from '../__internal__/service/index.js';
import { json2block } from '../__internal__/service/json2block.js';
import type { ListBlockModel } from './list-model.js';
export class ListBlockService extends BaseService<ListBlockModel> {
  override block2html(
    block: ListBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ) {
    let text = super.block2html(block, {
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
      previousSiblingBlock.type !== block.type
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
      nextSiblingBlock.type !== block.type
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

  override async json2Block(
    focusedBlockModel: BaseBlockModel,
    pastedBlocks: SerializedBlock[],
    range?: BlockRange
  ) {
    const convertToPastedIfEmpty = pastedBlocks[0].flavour !== 'affine:list';
    return json2block(focusedBlockModel, pastedBlocks, {
      range,
      convertToPastedIfEmpty,
    });
  }
}
