import type {
  BookmarkBlockModel,
  CodeBlockSchema,
  DatabaseBlockSchema,
  DividerBlockSchema,
  ImageBlockSchema,
  ListBlockSchema,
  NoteBlockSchema,
  PageBlockSchema,
  ParagraphBlockSchema,
  SurfaceBlockSchema,
} from '@blocksuite/blocks';
import type { BookmarkBlockSchema } from '@blocksuite/blocks';
import type {
  // Model
  CodeBlockModel,
  DatabaseBlockModel,
  DividerBlockModel,
  ImageBlockModel,
  ListBlockModel,
  NoteBlockModel,
  PageBlockModel,
  ParagraphBlockModel,
  SurfaceBlockModel,
} from '@blocksuite/blocks/models';

export type BlockSchemas = {
  'affine:paragraph': typeof ParagraphBlockSchema;
  'affine:page': typeof PageBlockSchema;
  'affine:list': typeof ListBlockSchema;
  'affine:note': typeof NoteBlockSchema;
  'affine:code': typeof CodeBlockSchema;
  'affine:divider': typeof DividerBlockSchema;
  'affine:image': typeof ImageBlockSchema;
  'affine:surface': typeof SurfaceBlockSchema;
  'affine:database': typeof DatabaseBlockSchema;
  'affine:bookmark': typeof BookmarkBlockSchema;
};

export type BlockModels = {
  'affine:paragraph': ParagraphBlockModel;
  'affine:page': PageBlockModel;
  'affine:list': ListBlockModel;
  'affine:note': NoteBlockModel;
  'affine:code': CodeBlockModel;
  'affine:divider': DividerBlockModel;
  'affine:image': ImageBlockModel;
  'affine:surface': SurfaceBlockModel;
  'affine:database': DatabaseBlockModel;
  'affine:bookmark': BookmarkBlockModel;
};

export type BlockModelProps = {
  [K in keyof BlockSchemas]: ReturnType<BlockSchemas[K]['model']['props']>;
};

export * from './utils/types.js';
