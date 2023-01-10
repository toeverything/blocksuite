import type { SyncServiceProtocol } from '../__internal__/index.js';
import type { DividerBlockModel } from './divider-model.js';
import { BaseService } from '../__internal__/service.js';

export class DividerBlockService
  extends BaseService
  implements SyncServiceProtocol
{
  isLoaded = true as const;

  block2html(
    model: DividerBlockModel,
    _previousSiblingId: string,
    _nextSiblingId: string
  ) {
    return `<hr/>`;
  }
}
