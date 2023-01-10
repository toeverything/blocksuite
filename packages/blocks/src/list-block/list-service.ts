import type { SyncServiceProtocol } from '../__internal__/index.js';
import type { ListBlockModel } from './list-model.js';
import { BaseService } from '../__internal__/service.js';

export class ListBlockService
  extends BaseService
  implements SyncServiceProtocol
{
  isLoaded = true as const;

  override block2html(
    model: ListBlockModel,
    childText: string,
    previousSiblingId: string,
    nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    let text = super.block2html(
      model,
      childText,
      previousSiblingId,
      nextSiblingId,
      begin,
      end
    );
    const previousSiblingBlock = model.page.getBlockById(previousSiblingId);
    const nextSiblingBlock = model.page.getBlockById(nextSiblingId);
    switch (model.type) {
      case 'bulleted':
        text = `<li>${text}</li>`;
        break;
      case 'numbered':
        text = `<li>${text}</li>`;
        break;
      case 'todo':
        text = `<li><input disabled type="checkbox" ${
          model.checked ? 'checked' : ''
        }>${text}</li>`;
        break;
      default:
        break;
    }
    if (
      previousSiblingBlock?.flavour !== model.flavour ||
      previousSiblingBlock.type !== model.type
    ) {
      switch (model.type) {
        case 'bulleted':
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
      nextSiblingBlock?.flavour !== model.flavour ||
      nextSiblingBlock.type !== model.type
    ) {
      switch (model.type) {
        case 'bulleted':
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
