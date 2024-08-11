import type { BlockSpec } from '@blocksuite/block-std';

import { SurfaceRefBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import { SurfaceRefBlockService } from './surface-ref-service.js';

export const PageSurfaceRefBlockSpec: BlockSpec = {
  schema: SurfaceRefBlockSchema,
  service: SurfaceRefBlockService,
  view: {
    component: literal`affine-surface-ref`,
    widgets: {
      surfaceToolbar: literal`affine-surface-ref-toolbar`,
    },
  },
};

export const EdgelessSurfaceRefBlockSpec: BlockSpec = {
  schema: SurfaceRefBlockSchema,
  service: SurfaceRefBlockService,
  view: {
    component: literal`affine-edgeless-surface-ref`,
  },
};
