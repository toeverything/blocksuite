import { BaseService } from '../__internal__/service.js';
import type { PageBlockModel } from './page-model.js';

export class PageBlockService extends BaseService {
  override block2html(
    block: PageBlockModel,
    childText: string,
    previousSiblingId: string,
    nextSiblingId: string,
    begin?: number,
    end?: number
  ) {
    return `<div>${block.title}${childText}</div>`;
  }

  override block2Text(
    block: PageBlockModel,
    childText: string,
    begin?: number,
    end?: number
  ) {
    const text = (block.title || '').slice(begin || 0, end);
    return `${text}${childText}`;
  }
}
