import type { AIChatBlockModel } from './ai-chat-model.js';

export * from './ai-chat-block.js';
export * from './ai-chat-edgeless-block.js';
export * from './ai-chat-model.js';
export * from './ai-chat-spec.js';
export * from './consts.js';

declare global {
  namespace BlockSuite {
    interface BlocksModels {
      'affine:embed-ai-chat': AIChatBlockModel;
    }

    interface EdgelessBlockModelMap {
      'affine:embed-ai-chat': AIChatBlockModel;
    }
  }
}
