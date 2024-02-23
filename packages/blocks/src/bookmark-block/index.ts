import type { BookmarkService } from './bookmark-service.js';

export * from './bookmark-block.js';
export * from './bookmark-model.js';
export * from './bookmark-service.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:bookmark': BookmarkService;
    }
  }
}
