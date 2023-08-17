import type { SerializedBlock } from '../__internal__/index.js';
import { BaseService } from '../__internal__/service/service.js';
import type { AttachmentBlockModel } from './attachment-model.js';
import { cloneAttachmentProperties } from './utils.js';

export class AttachmentBlockService extends BaseService<AttachmentBlockModel> {
  override async block2html(block: AttachmentBlockModel) {
    return `<p>Attachment-${block.name}</p>`;
  }
  override block2Text(block: AttachmentBlockModel): string {
    return `Attachment-${block.name}`;
  }

  override block2Json(block: AttachmentBlockModel): SerializedBlock {
    const clonedProps = cloneAttachmentProperties(block);
    return {
      flavour: block.flavour,
      children: [],
      ...clonedProps,
    };
  }
}
