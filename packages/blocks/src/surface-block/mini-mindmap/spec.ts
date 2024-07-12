import type { BlockSpec } from '@blocksuite/block-std';
import type { BlockSchema } from '@blocksuite/store';
import type { z } from 'zod';

import { literal } from 'lit/static-html.js';

import { RootBlockSchema } from '../../root-block/root-model.js';
import { SurfaceBlockSchema } from '../surface-model.js';
import { MindmapService } from './service.js';

export const MiniMindmapSpecs: BlockSpec[] = [
  {
    schema: RootBlockSchema,
    service: MindmapService,
    view: {
      component: literal`mini-mindmap-root-block`,
    },
  },
  {
    schema: SurfaceBlockSchema,
    view: {
      component: literal`mini-mindmap-surface-block`,
    },
  },
];

export const MiniMindmapSchema: z.infer<typeof BlockSchema>[] = [
  RootBlockSchema,
  SurfaceBlockSchema,
];
