import type { CalloutBlockModel } from './callout-model.js';
import type { CalloutService } from './callout-service.js';

export * from './callout-block.js';
export * from './callout-model.js';
export * from './callout-service.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:callout': CalloutBlockModel;
    }
    interface BlockServices {
      'affine:callout': CalloutService;
    }
  }
}
