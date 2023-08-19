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
    selectedModels?: Map<string, number>,
    begin?: number,
    end?: number
  ): SerializedBlock {
    const lastBlockId = selectedModels
      ? [...selectedModels.entries()].reduce((p, c) => (c[1] > p[1] ? c : p))[0]
      : '';
    const delta =
      block.text?.sliceToDelta(
        begin ?? 0,
        lastBlockId === block.id ? end : undefined
      ) ?? [];
    return {
      flavour: block.flavour,
      text: delta,
      xywh: block.xywh,
      background: block.background,
      children: block.children
        ?.filter(child => selectedModels?.has(child.id) ?? true)
        .map((child, index, array) => {
          if (index === array.length - 1) {
            return getService(child.flavour).block2Json(
              child,
              selectedModels,
              0,
              end
            );
          }
          return getService(child.flavour).block2Json(child, selectedModels);
        }),
    };
  }
}
