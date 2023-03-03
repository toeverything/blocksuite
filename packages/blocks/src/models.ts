/// <reference types="@blocksuite/global" />
// Import models only, the bundled file should not include anything else.
import type { BlockSchema } from '@blocksuite/store';
import type { z } from 'zod';

import type { BaseService } from './__internal__/service/index.js';
import {
  CodeBlockModel,
  CodeBlockModelSchema,
} from './code-block/code-model.js';
import { CodeBlockService } from './code-block/code-service.js';
import type { DatabaseBlockModel } from './database-block/database-model.js';
import { DatabaseBlockModelSchema } from './database-block/database-model.js';
import type { DividerBlockModel } from './divider-block/divider-model.js';
import { DividerBlockModelSchema } from './divider-block/divider-model.js';
import { DividerBlockService } from './divider-block/divider-service.js';
import type { EmbedBlockModel } from './embed-block/embed-model.js';
import { EmbedBlockModelSchema } from './embed-block/embed-model.js';
import { EmbedBlockService } from './embed-block/embed-service.js';
import type { FrameBlockModel } from './frame-block/frame-model.js';
import { FrameBlockModelSchema } from './frame-block/frame-model.js';
import { FrameBlockService } from './frame-block/frame-service.js';
import type { ListBlockModel } from './list-block/list-model.js';
import { ListBlockModelSchema } from './list-block/list-model.js';
import { ListBlockService } from './list-block/list-service.js';
import type { PageBlockModel } from './page-block/page-model.js';
import { PageBlockModelSchema } from './page-block/page-model.js';
import type { ParagraphBlockModel } from './paragraph-block/paragraph-model.js';
import { ParagraphBlockModelSchema } from './paragraph-block/paragraph-model.js';
import { ParagraphBlockService } from './paragraph-block/paragraph-service.js';
import type { SurfaceBlockModel } from './surface-block/surface-model.js';
import { SurfaceBlockModelSchema } from './surface-block/surface-model.js';

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

/** Default first party model types built for affine */
export const builtInSchemas = [
  CodeBlockModelSchema,
  ParagraphBlockModelSchema,
  PageBlockModelSchema,
  ListBlockModelSchema,
  FrameBlockModelSchema,
  DividerBlockModelSchema,
  EmbedBlockModelSchema,
  SurfaceBlockModelSchema,
  // DatabaseBlockModelSchema,
] satisfies z.infer<typeof BlockSchema>[];

export const __unstableSchemas = [DatabaseBlockModelSchema] satisfies z.infer<
  typeof BlockSchema
>[];

// TODO support dynamic register
export type BlockSchema = {
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

export type Flavour = keyof BlockSchema;

export const blockService = {
  'affine:code': CodeBlockService,
  'affine:paragraph': ParagraphBlockService,
  'affine:list': ListBlockService,
  'affine:embed': EmbedBlockService,
  'affine:divider': DividerBlockService,
  'affine:frame': FrameBlockService,
} satisfies {
  [key in Flavour]?: { new (): BaseService };
};

export type BlockService = typeof blockService;

export type ServiceFlavour = keyof BlockService;

export type BlockServiceInstance = {
  [Key in Flavour]: Key extends ServiceFlavour
    ? BlockService[Key] extends { new (): unknown }
      ? InstanceType<BlockService[Key]>
      : never
    : InstanceType<typeof BaseService>;
};
