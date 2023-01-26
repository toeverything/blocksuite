import { BaseService } from '../__internal__/service.js';
import type { DividerBlockModel } from './divider-model.js';

export class DividerBlockService extends BaseService {
  override block2html(
    block: DividerBlockModel,
    childText: string,
    _previousSiblingId: string,
    _nextSiblingId: string,
    begin?: number,
    end?: number
  ): string {
    return `<hr/>`;
  }
}
