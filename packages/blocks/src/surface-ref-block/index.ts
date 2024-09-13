import type { SurfaceRefBlockService } from './surface-ref-service.js';

export * from './surface-ref-block.js';
export * from './surface-ref-block-edgeless.js';
export * from './surface-ref-service.js';
export {
  EdgelessSurfaceRefBlockSpec,
  PageSurfaceRefBlockSpec,
} from './surface-ref-spec.js';

export * from './utils.js';

declare global {
  namespace BlockSuite {
    interface BlockServices {
      'affine:surface-ref': SurfaceRefBlockService;
    }
  }
}
