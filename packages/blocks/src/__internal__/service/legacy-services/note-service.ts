import type { BaseBlockModel } from '@blocksuite/store';

import type { NoteBlockModel } from '../../../note-block/note-model.js';
import type {
  BlockTransformContext,
  SerializedBlock,
} from '../../utils/index.js';
import { addSerializedBlocks } from '../json2block.js';
import { BaseService } from '../service.js';

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

  override async block2markdown(
    _block: NoteBlockModel,
    { childText = '' }: BlockTransformContext = {},
    _blobMap?: Map<string, string>
  ): Promise<string> {
    return childText;
  }

  override block2Json(
    block: NoteBlockModel,
    children: SerializedBlock[],
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
      children,
    };
  }
}
