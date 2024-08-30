import { SurfaceRefBlockSchema } from '@blocksuite/affine-model';
import { type BlockSpec, FlavourExtension } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { SurfaceRefBlockService } from './surface-ref-service.js';

export const PageSurfaceRefBlockSpec: BlockSpec = {
  schema: SurfaceRefBlockSchema,
  view: {
    component: literal`affine-surface-ref`,
    widgets: {
      surfaceToolbar: literal`affine-surface-ref-toolbar`,
    },
  },
  extensions: [FlavourExtension('affine:surface-ref'), SurfaceRefBlockService],
};

export const EdgelessSurfaceRefBlockSpec: BlockSpec = {
  schema: SurfaceRefBlockSchema,
  view: {
    component: literal`affine-edgeless-surface-ref`,
  },
  extensions: [FlavourExtension('affine:surface-ref'), SurfaceRefBlockService],
};
