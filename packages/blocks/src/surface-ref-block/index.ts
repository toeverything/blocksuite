import type { SurfaceRefBlockService } from './surface-ref-service.js';

export * from './surface-ref-block.js';
export * from './surface-ref-block-edgeless.js';
export * from './surface-ref-service.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:surface-ref': SurfaceRefBlockService;
    }
  }
}
