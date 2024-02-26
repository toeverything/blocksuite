import type { AttachmentBlockModel } from './attachment-model.js';
import type { AttachmentService } from './attachment-service.js';

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
      'affine:attachment': AttachmentService;
    }

    interface BlockModels {
      'affine:attachment': AttachmentBlockModel;
    }
  }
}
