import type { DividerBlockModel } from '../../../divider-block/divider-model.js';
import { BaseService } from '../service.js';

export class DividerBlockService extends BaseService<DividerBlockModel> {
  override async block2html(): Promise<string> {
    return `<hr/>`;
  }

  override async block2markdown(): Promise<string> {
    return '* * *';
  }
}
