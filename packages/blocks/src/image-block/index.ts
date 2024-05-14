import type { ImageBlockModel } from './image-model.js';
import type { ImageBlockService } from './image-service.js';

export * from './image-block.js';
export * from './image-model.js';
export { ImageSelection } from './image-selection.js';
export * from './image-service.js';

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:image': ImageBlockModel;
    }
    interface BlockServices {
      'affine:image': ImageBlockService;
    }
  }
}
