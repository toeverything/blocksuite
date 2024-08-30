import { type BlockSpec, FlavourExtension } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { commands } from './commands/index.js';
import './surface-block-void.js';
import { SurfaceBlockSchema } from './surface-model.js';
import { SurfaceBlockService } from './surface-service.js';

export const PageSurfaceBlockSpec: BlockSpec = {
  schema: SurfaceBlockSchema,
  view: {
    component: literal`affine-surface-void`,
  },
  commands,
  extensions: [FlavourExtension('affine:surface'), SurfaceBlockService],
};

export const EdgelessSurfaceBlockSpec: BlockSpec = {
  schema: SurfaceBlockSchema,
  view: {
    component: literal`affine-surface`,
  },
  commands,
  extensions: [FlavourExtension('affine:surface'), SurfaceBlockService],
};
