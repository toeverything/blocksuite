import type { BaseBlockModel } from '@blocksuite/store';

import { getService } from '../__internal__/service.js';
import { BaseService } from '../__internal__/service/index.js';
import { addSerializedBlocks } from '../__internal__/service/json2block.js';
import type { SerializedBlock } from '../__internal__/utils/index.js';
import type { NoteBlockModel } from './note-model.js';

export class NoteBlockService extends BaseService<NoteBlockModel> {
  override async json2Block(
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

  override block2Json(
    block: NoteBlockModel,
    begin?: number,
    end?: number
  ): SerializedBlock {
    const delta = block.text?.sliceToDelta(begin || 0, end) || [];
    return {
      flavour: block.flavour,
      type: block.type as string,
      text: delta,
      xywh: block.xywh,
      background: block.background,
      children: block.children?.map((child, index) => {
        if (index === block.children.length - 1) {
          return getService(child.flavour).block2Json(child, 0, end);
        }
        return getService(child.flavour).block2Json(child);
      }),
    };
  }
}
