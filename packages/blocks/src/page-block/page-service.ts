import { BaseService } from '../__internal__/service.js';
import type { SyncServiceProtocol } from '../__internal__/index.js';
import type { PageBlockModel } from './page-model.js';

export class PageBlockService
  extends BaseService
  implements SyncServiceProtocol
{
  isLoaded = true as const;

  override block2html(
    model: PageBlockModel,
    childText: string,
    previousSiblingId: string,
    nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    return `<div>${model.title}${childText}</div>`;
  }

  override block2Text(
    model: PageBlockModel,
    childText: string,
    begin?: number,
    end?: number
  ) {
    const text = (model.title || '').slice(begin || 0, end);
    return `${text}${childText}`;
  }
}
