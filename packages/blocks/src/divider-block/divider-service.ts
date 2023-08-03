import type { BlockTransformContext } from '../__internal__/index.js';
import { BaseService } from '../__internal__/service/index.js';
import type { DividerBlockModel } from './divider-model.js';

export class DividerBlockService extends BaseService<DividerBlockModel> {
  override async block2html(
    block: DividerBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ): Promise<string> {
    return `<hr/>`;
  }
}
