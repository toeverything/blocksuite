/// <reference types="@blocksuite/global" />
// Import models only, the bundled file should not include anything else.
import type { UnionToIntersection } from '@blocksuite/global/types';
import type { BlockSchema } from '@blocksuite/store';
import type { z } from 'zod';

import type { BaseService } from './__internal__/service/index.js';
import {
  type CodeBlockModel,
  CodeBlockSchema,
  CodeBlockService,
} from './code-block/index.js';
import {
  type DatabaseBlockModel,
  DatabaseBlockSchema,
} from './database-block/index.js';
import {
  type DividerBlockModel,
  DividerBlockSchema,
  DividerBlockService,
} from './divider-block/index.js';
import {
  type EmbedBlockModel,
  EmbedBlockSchema,
  EmbedBlockService,
} from './embed-block/index.js';
import {
  type FrameBlockModel,
  FrameBlockSchema,
  FrameBlockService,
} from './frame-block/index.js';
import {
  type ListBlockModel,
  ListBlockSchema,
  ListBlockService,
} from './list-block/index.js';
import type { PageBlockModel } from './page-block/index.js';
// FIXME: unable to import from ./page-block/index.js
import { PageBlockSchema } from './page-block/page-model.js';
import {
  type ParagraphBlockModel,
  ParagraphBlockSchema,
  ParagraphBlockService,
} from './paragraph-block/index.js';
import {
  type SurfaceBlockModel,
  SurfaceBlockSchema,
} from './surface-block/index.js';

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
export const AffineSchemas = [
  CodeBlockSchema,
  ParagraphBlockSchema,
  PageBlockSchema,
  ListBlockSchema,
  FrameBlockSchema,
  DividerBlockSchema,
  EmbedBlockSchema,
  SurfaceBlockSchema,
  // DatabaseBlockSchema,
] satisfies z.infer<typeof BlockSchema>[];

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

export type BlockServiceInstanceByKey<Key extends Flavour> =
  UnionToIntersection<BlockServiceInstance[Key]>;
