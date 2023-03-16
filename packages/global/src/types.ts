import type {
  CodeBlockModelSchema,
  DatabaseBlockModelSchema,
  DividerBlockModelSchema,
  EmbedBlockModelSchema,
  FrameBlockModelSchema,
  ListBlockModelSchema,
  PageBlockModelSchema,
  ParagraphBlockModelSchema,
  SurfaceBlockModelSchema,
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
  'affine:paragraph': typeof ParagraphBlockModelSchema;
  'affine:page': typeof PageBlockModelSchema;
  'affine:list': typeof ListBlockModelSchema;
  'affine:frame': typeof FrameBlockModelSchema;
  'affine:code': typeof CodeBlockModelSchema;
  'affine:divider': typeof DividerBlockModelSchema;
  'affine:embed': typeof EmbedBlockModelSchema;
  'affine:surface': typeof SurfaceBlockModelSchema;
  'affine:database': typeof DatabaseBlockModelSchema;
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
