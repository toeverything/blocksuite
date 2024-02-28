import type { FrameBlockModel } from './frame-model.js';

export * from './frame-block.js';
export * from './frame-model.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:frame': FrameBlockModel;
    }
  }
}
