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
      type: block.type as string,
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
