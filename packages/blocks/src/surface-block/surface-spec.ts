import type { BlockSpec } from '@blocksuite/block-std';

import { literal } from 'lit/static-html.js';

import { SurfaceBlockSchema } from './surface-model.js';
import { SurfaceBlockService } from './surface-service.js';

export const PageSurfaceBlockSpec: BlockSpec = {
  schema: SurfaceBlockSchema,
  service: SurfaceBlockService,
  view: {
    component: literal`affine-surface`,
  },
};

export const EdgelessSurfaceBlockSpec: BlockSpec = {
  schema: SurfaceBlockSchema,
  service: SurfaceBlockService,
  view: {
    component: literal`affine-surface`,
  },
};
