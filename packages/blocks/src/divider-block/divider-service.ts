import { BaseService } from '../__internal__/service/index.js';
import type { DividerBlockModel } from './divider-model.js';

export class DividerBlockService extends BaseService {
  override block2html(
    block: DividerBlockModel,
    {
      childText = '',
      begin,
      end,
    }: {
      childText?: string;
      begin?: number;
      end?: number;
    } = {}
  ): string {
    return `<hr/>`;
  }
}
