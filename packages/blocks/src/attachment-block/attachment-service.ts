import type {
  BlockTransformContext,
  SerializedBlock,
} from '../__internal__/index.js';
import { BaseService } from '../__internal__/service/index.js';
import type { AttachmentBlockModel } from './attachment-model.js';
import { cloneAttachmentProperties } from './utils.js';

export class AttachmentBlockService extends BaseService<AttachmentBlockModel> {
  override block2html(
    block: AttachmentBlockModel,
    { childText = '', begin, end }: BlockTransformContext = {}
  ) {
    return `<p>Attachment-${block.name}</a></p>`;
  }
  override block2Text(
    block: AttachmentBlockModel,
    { childText = '', begin = 0, end }: BlockTransformContext = {}
  ): string {
    return block.name;
  }

  override block2Json(
    block: AttachmentBlockModel,
    begin?: number,
    end?: number
  ): SerializedBlock {
    const clonedProps = cloneAttachmentProperties(block);

    return {
      flavour: block.flavour,
      children: [],
      ...clonedProps,
    };
  }
}
