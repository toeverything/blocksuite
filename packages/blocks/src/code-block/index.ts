import type { CodeBlockModel } from './code-model.js';

export * from './code-block.js';
export * from './code-model.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:code': CodeBlockModel;
    }
  }
}
