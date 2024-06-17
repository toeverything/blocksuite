import type { EdgelessTextBlockModel } from './edgeless-text-model.js';

export * from './edgeless-text-block.js';
export * from './edgeless-text-model.js';
export * from './edgeless-text-service.js';
export * from './edgeless-text-spec.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:edgeless-text': EdgelessTextBlockModel;
    }

    interface EdgelessBlockModelMap {
      'affine:edgeless-text': EdgelessTextBlockModel;
    }

    interface EdgelessTextModelMap {
      'edgeless-text': EdgelessTextBlockModel;
    }
  }
}
