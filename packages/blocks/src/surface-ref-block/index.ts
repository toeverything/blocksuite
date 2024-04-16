import type { BlockSpec } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import {
  type SurfaceRefBlockModel,
  SurfaceRefBlockSchema,
} from './surface-ref-model.js';
import { SurfaceRefBlockService } from './surface-ref-service.js';

export * from './surface-ref-block.js';
export * from './surface-ref-block-edgeless.js';
export * from './surface-ref-model.js';
export * from './surface-ref-service.js';

export const surfaceRefSpec: BlockSpec = {
  schema: SurfaceRefBlockSchema,
  service: SurfaceRefBlockService,
  view: {
    component: literal`affine-surface-ref`,
    widgets: {
      surfaceToolbar: literal`affine-surface-ref-toolbar`,
    },
  },
};

declare global {
  namespace BlockSuite {
    interface BlockModels {
      'affine:surface-ref': SurfaceRefBlockModel;
    }
    interface BlockServices {
      'affine:surface-ref': SurfaceRefBlockService;
    }
  }
}
