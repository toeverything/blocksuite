import { BaseService } from '../__internal__/service/service.js';
import type { DividerBlockModel } from './divider-model.js';

export class DividerBlockService extends BaseService<DividerBlockModel> {
  override async block2html(): Promise<string> {
    return `<hr/>`;
  }
}
