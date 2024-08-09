import type { ImageBlockService } from './image-service.js';

export * from './image-block.js';
export { ImageSelection } from './image-selection.js';
export * from './image-service.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:image': ImageBlockService;
    }
  }
}
