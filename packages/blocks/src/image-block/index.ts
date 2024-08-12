import type { ImageBlockService } from './image-service.js';

export * from './image-block.js';
export * from './image-service.js';
export { ImageSelection } from '@blocksuite/affine-shared/selection';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:image': ImageBlockService;
    }
  }
}
