/// <reference types="@blocksuite/global" />
// Import models only, the bundled file should not include anything else.
import { CodeBlockModel } from './code-block/code-model.js';
import { DividerBlockModel } from './divider-block/divider-model.js';
import { EmbedBlockModel } from './embed-block/embed-model.js';
import { FrameBlockModel } from './frame-block/frame-model.js';
import { ListBlockModel } from './list-block/list-model.js';
import { PageBlockModel } from './page-block/page-model.js';
import { ParagraphBlockModel } from './paragraph-block/paragraph-model.js';
import { ParagraphBlockService } from './paragraph-block/paragraph-service.js';
import { SurfaceBlockModel } from './surface-block/surface-model.js';
import { DatabaseBlockModel } from './database-block/database-model.js';
import { CodeBlockService } from './code-block/code-service.js';
import type { BaseService } from './__internal__/service.js';
import { ListBlockService } from './list-block/list-service.js';
import { DividerBlockService } from './divider-block/divider-service.js';

export {
  CodeBlockModel,
  DividerBlockModel,
  EmbedBlockModel,
  FrameBlockModel,
  ListBlockModel,
  PageBlockModel,
  ParagraphBlockModel,
  DatabaseBlockModel,
};

// TODO support dynamic register
export const BlockSchema = {
  'affine:paragraph': ParagraphBlockModel,
  'affine:page': PageBlockModel,
  'affine:list': ListBlockModel,
  'affine:frame': FrameBlockModel,
  'affine:code': CodeBlockModel,
  'affine:divider': DividerBlockModel,
  'affine:embed': EmbedBlockModel,
  'affine:surface': SurfaceBlockModel,
  'affine:database': DatabaseBlockModel,
};

export type Flavour = keyof typeof BlockSchema;

export const blockService = {
  'affine:code': CodeBlockService,
  'affine:paragraph': ParagraphBlockService,
  'affine:list': ListBlockService,
  'affine:divider': DividerBlockService,
} satisfies {
  [key: string]: typeof BaseService;
};

export type BlockService = typeof blockService;

export type ServiceFlavour = keyof BlockService;

type RemoveInternals<T> = Omit<T, 'onLoad'>;

export type BlockServiceInstance = {
  [Key in keyof BlockService]: BlockService[Key] extends { new (): unknown }
    ? RemoveInternals<InstanceType<BlockService[Key]>>
    : never;
};
