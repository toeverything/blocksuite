import type { BaseBlockModel } from '@blocksuite/store';

import type {
  AttachmentBlockModel,
  AttachmentBlockSchema,
  BookmarkBlockModel,
  BookmarkBlockSchema,
  CodeBlockModel,
  CodeBlockSchema,
  DatabaseBlockModel,
  DatabaseBlockSchema,
  DataViewBlockModel,
  DataViewBlockSchema,
  DividerBlockModel,
  DividerBlockSchema,
  ImageBlockModel,
  ImageBlockSchema,
  ListBlockModel,
  ListBlockSchema,
  NoteBlockModel,
  NoteBlockSchema,
  PageBlockModel,
  PageBlockSchema,
  ParagraphBlockModel,
  ParagraphBlockSchema,
  SurfaceBlockModel,
  SurfaceBlockSchema,
} from '../../index.js';

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
  'affine:data-view': DataViewBlockModel;
  'affine:bookmark': BookmarkBlockModel;
  'affine:attachment': AttachmentBlockModel;
};

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
  'affine:data-view': typeof DataViewBlockSchema;
  'affine:bookmark': typeof BookmarkBlockSchema;
  'affine:attachment': typeof AttachmentBlockSchema;
};

export type BlockModelProps = {
  [K in keyof BlockSchemas]: ReturnType<BlockSchemas[K]['model']['props']>;
};

export function assertFlavours(model: { flavour: string }, allowed: string[]) {
  if (!allowed.includes(model.flavour)) {
    throw new Error(`model flavour ${model.flavour} is not allowed`);
  }
}

type BlockModelKey = keyof BlockModels;
type Flavours<T> = T extends BlockModelKey[] ? BlockModels[T[number]] : never;
type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export function matchFlavours<const Key extends readonly string[]>(
  model: BaseBlockModel,
  expected: Key
): model is Flavours<Writeable<Key>> {
  return expected.includes(model.flavour);
}
