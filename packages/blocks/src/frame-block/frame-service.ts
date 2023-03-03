import type { BaseBlockModel } from '@blocksuite/store';

import { BaseService } from '../__internal__/service/index.js';
import { addBlocks } from '../__internal__/service/json2block.js';
import type { OpenBlockInfo } from '../__internal__/utils/index.js';
export class FrameBlockService extends BaseService {
  json2Block(
    focusedBlockModel: BaseBlockModel,
    pastedBlocks: OpenBlockInfo[]
  ): void {
    addBlocks(focusedBlockModel.page, pastedBlocks, focusedBlockModel, 0);
  }
}
