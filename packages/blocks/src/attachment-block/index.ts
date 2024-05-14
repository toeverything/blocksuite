import type { AttachmentBlockModel } from './attachment-model.js';
import type { AttachmentBlockService } from './attachment-service.js';

export * from './attachment-block.js';
export {
  AttachmentBlockModel,
  type AttachmentBlockProps,
  AttachmentBlockSchema,
} from './attachment-model.js';
export * from './attachment-service.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:attachment': AttachmentBlockService;
    }

    interface BlockModels {
      'affine:attachment': AttachmentBlockModel;
    }
  }
}
