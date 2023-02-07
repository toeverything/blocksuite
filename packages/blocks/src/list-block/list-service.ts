import { BaseService } from '../__internal__/service/index.js';
import type { ListBlockModel } from './list-model.js';

export class ListBlockService extends BaseService {
  override block2html(
    block: ListBlockModel,
    childText: string,
    previousSiblingId: string,
    nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    let text = super.block2html(
      block,
      childText,
      previousSiblingId,
      nextSiblingId,
      begin,
      end
    );
    const previousSiblingBlock = block.page.getBlockById(previousSiblingId);
    const nextSiblingBlock = block.page.getBlockById(nextSiblingId);
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
}
