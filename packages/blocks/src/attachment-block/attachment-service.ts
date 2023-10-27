import { BlockService } from '@blocksuite/block-std';

import type { AttachmentBlockModel } from './attachment-model.js';

export class AttachmentService extends BlockService<AttachmentBlockModel> {
  override mounted(): void {
    // default to 10MB
    this.workspace.config.set('attachmentMaxFileSize', 10 * 1000 * 1000);
  }
}
