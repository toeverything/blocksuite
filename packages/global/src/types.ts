import type {
  CodeBlockSchema,
  DatabaseBlockSchema,
  DividerBlockSchema,
  EmbedBlockSchema,
  FrameBlockSchema,
  ListBlockSchema,
  PageBlockSchema,
  ParagraphBlockSchema,
  SurfaceBlockSchema,
} from '@blocksuite/blocks';
import type {
  // Model
  CodeBlockModel,
  DatabaseBlockModel,
  DividerBlockModel,
  EmbedBlockModel,
  FrameBlockModel,
  ListBlockModel,
  PageBlockModel,
  ParagraphBlockModel,
  SurfaceBlockModel,
} from '@blocksuite/blocks/models';

export type BlockSchemas = {
  'affine:paragraph': typeof ParagraphBlockSchema;
  'affine:page': typeof PageBlockSchema;
  'affine:list': typeof ListBlockSchema;
  'affine:frame': typeof FrameBlockSchema;
  'affine:code': typeof CodeBlockSchema;
  'affine:divider': typeof DividerBlockSchema;
  'affine:embed': typeof EmbedBlockSchema;
  'affine:surface': typeof SurfaceBlockSchema;
  'affine:database': typeof DatabaseBlockSchema;
};

export type BlockModels = {
  'affine:paragraph': ParagraphBlockModel;
  'affine:page': PageBlockModel;
  'affine:list': ListBlockModel;
  'affine:frame': FrameBlockModel;
  'affine:code': CodeBlockModel;
  'affine:divider': DividerBlockModel;
  'affine:embed': EmbedBlockModel;
  'affine:surface': SurfaceBlockModel;
  'affine:database': DatabaseBlockModel;
};

export type BlockModelProps = {
  [K in keyof BlockSchemas]: ReturnType<BlockSchemas[K]['model']['props']>;
};

export * from './utils/types.js';
