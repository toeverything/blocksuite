import type { BaseBlockModel } from '@blocksuite/store';

import { BaseService } from '../__internal__/service/index.js';
import { addSerializedBlocks } from '../__internal__/service/json2block.js';
import type { SerializedBlock } from '../__internal__/utils/index.js';
import type { FrameBlockModel } from './frame-model.js';
export class FrameBlockService extends BaseService<FrameBlockModel> {
  async json2Block(
    focusedBlockModel: BaseBlockModel,
    pastedBlocks: SerializedBlock[]
  ) {
    await addSerializedBlocks(
      focusedBlockModel.page,
      pastedBlocks,
      focusedBlockModel,
      0
    );
  }
}
