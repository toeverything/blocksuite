import type { BlockSchema } from '@blocksuite/store';
import type { z } from 'zod';

import { RootBlockSchema } from '@blocksuite/affine-model';
import { type BlockSpec, FlavourExtension } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { SurfaceBlockSchema } from '../surface-model.js';
import { MindmapService } from './service.js';

export const MiniMindmapSpecs: BlockSpec[] = [
  {
    schema: RootBlockSchema,
    view: {
      component: literal`mini-mindmap-root-block`,
    },
    extensions: [FlavourExtension('affine:page'), MindmapService],
  },
  {
    schema: SurfaceBlockSchema,
    view: {
      component: literal`mini-mindmap-surface-block`,
    },
    extensions: [FlavourExtension('affine:surface')],
  },
];

export const MiniMindmapSchema: z.infer<typeof BlockSchema>[] = [
  RootBlockSchema,
  SurfaceBlockSchema,
];
