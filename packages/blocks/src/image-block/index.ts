import type { ImageService } from './image-service.js';

export * from './image-block.js';
export * from './image-model.js';
export * from './image-service.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:image': ImageService;
    }
  }
}
