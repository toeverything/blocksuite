import type { AttachmentBlockModel } from '../../../attachment-block/attachment-model.js';
import { cloneAttachmentProperties } from '../../../attachment-block/utils.js';
import type { SerializedBlock } from '../../index.js';
import { BaseService } from '../service.js';

export class AttachmentBlockService extends BaseService<AttachmentBlockModel> {
  override async block2html(block: AttachmentBlockModel) {
    return `<p>Attachment-${block.name}</p>`;
  }
  override block2Text(block: AttachmentBlockModel): string {
    return `Attachment-${block.name}`;
  }

  override block2Json(
    block: AttachmentBlockModel,
    children: SerializedBlock[]
  ): SerializedBlock {
    const clonedProps = cloneAttachmentProperties(block);
    return {
      flavour: block.flavour,
      children,
      ...clonedProps,
    };
  }
}
