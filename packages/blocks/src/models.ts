/// <reference types="@blocksuite/global" />
// Import models only, the bundled file should not include anything else.
import type { BlockSchema } from '@blocksuite/store';
import type { z } from 'zod';

import {
  type CodeBlockModel,
  CodeBlockSchema,
} from './code-block/code-model.js';
import type { DatabaseBlockModel } from './database-block/database-model.js';
import { DatabaseBlockSchema } from './database-block/database-model.js';
import type { DividerBlockModel } from './divider-block/divider-model.js';
import { DividerBlockSchema } from './divider-block/divider-model.js';
import type { EmbedBlockModel } from './embed-block/embed-model.js';
import { EmbedBlockSchema } from './embed-block/embed-model.js';
import type { FrameBlockModel } from './frame-block/frame-model.js';
import { FrameBlockSchema } from './frame-block/frame-model.js';
import type { ListBlockModel } from './list-block/list-model.js';
import { ListBlockSchema } from './list-block/list-model.js';
import type { PageBlockModel } from './page-block/page-model.js';
import { PageBlockSchema } from './page-block/page-model.js';
import type { ParagraphBlockModel } from './paragraph-block/paragraph-model.js';
import { ParagraphBlockSchema } from './paragraph-block/paragraph-model.js';
import type { SurfaceBlockModel } from './surface-block/surface-model.js';
import { SurfaceBlockSchema } from './surface-block/surface-model.js';

export type {
  CodeBlockModel,
  DatabaseBlockModel,
  DividerBlockModel,
  EmbedBlockModel,
  FrameBlockModel,
  ListBlockModel,
  PageBlockModel,
  ParagraphBlockModel,
  SurfaceBlockModel,
};

/** Built-in first party block models built for affine */
export const AffineSchemas: z.infer<typeof BlockSchema>[] = [
  CodeBlockSchema,
  ParagraphBlockSchema,
  PageBlockSchema,
  ListBlockSchema,
  FrameBlockSchema,
  DividerBlockSchema,
  EmbedBlockSchema,
  SurfaceBlockSchema,
  // DatabaseBlockSchema,
];

export const __unstableSchemas = [DatabaseBlockSchema] satisfies z.infer<
  typeof BlockSchema
>[];

// TODO support dynamic register
export type BlockSchemas = {
  'affine:code': CodeBlockModel;
  'affine:paragraph': ParagraphBlockModel;
  'affine:page': PageBlockModel;
  'affine:list': ListBlockModel;
  'affine:frame': FrameBlockModel;
  'affine:divider': DividerBlockModel;
  'affine:embed': EmbedBlockModel;
  'affine:surface': SurfaceBlockModel;
  'affine:database': DatabaseBlockModel;
};

export type Flavour = keyof BlockSchemas;
