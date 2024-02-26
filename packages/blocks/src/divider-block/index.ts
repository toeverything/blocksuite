import type { DividerBlockModel } from './divider-model.js';

export * from './divider-block.js';
export * from './divider-model.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:divider': DividerBlockModel;
    }
  }
}
