import { BlockService } from '@blocksuite/block-std';

import type { AttachmentBlockModel } from './attachment-model.js';

export class AttachmentService extends BlockService<AttachmentBlockModel> {
  maxFileSize = 10 * 1000 * 1000; // 10MB (default)
}
