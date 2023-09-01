import type { BaseBlockModel } from '@blocksuite/store';

import type { NoteBlockModel } from '../../../note-block/note-model.js';
import type { SerializedBlock } from '../../utils/index.js';
import { addSerializedBlocks } from '../json2block.js';
import { BaseService } from '../service.js';
import { getService } from '../singleton.js';

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
    children?: SerializedBlock[],
    begin?: number,
    end?: number
  ): SerializedBlock {
    const delta = block.text?.sliceToDelta(begin ?? 0, end) ?? [];
    return {
      id: block.id,
      flavour: block.flavour,
      text: delta,
      xywh: block.xywh,
      background: block.background,
      children:
        children ??
        block.children.map((child, index, array) => {
          if (index === array.length - 1) {
            // @ts-ignore
            return getService(child.flavour).block2Json(child, 0, end);
          }
          // @ts-ignore
          return getService(child.flavour).block2Json(child);
        }),
    };
  }
}
