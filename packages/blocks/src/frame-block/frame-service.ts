import type { BaseBlockModel } from '@blocksuite/store';

import { BaseService } from '../__internal__/service/index.js';
import { addBlocks } from '../__internal__/service/json2block.js';
import type { OpenBlockInfo } from '../__internal__/utils/index.js';
import type { FrameBlockModel } from './frame-model.js';
export class FrameBlockService extends BaseService<FrameBlockModel> {
  async json2Block(
    focusedBlockModel: BaseBlockModel,
    pastedBlocks: OpenBlockInfo[]
  ) {
    addBlocks(focusedBlockModel.page, pastedBlocks, focusedBlockModel, 0);
  }
}
