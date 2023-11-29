import type { BaseBlockModel, Page } from '@blocksuite/store';

import type { HtmlBlockSchema } from '../../html-block/html-model.js';
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
  FrameBlockModel,
  FrameBlockSchema,
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
  SurfaceRefBlockModel,
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
  'affine:frame': FrameBlockModel;
  'affine:database': DatabaseBlockModel;
  'affine:data-view': DataViewBlockModel;
  'affine:bookmark': BookmarkBlockModel;
  'affine:attachment': AttachmentBlockModel;
  'affine:surface-ref': SurfaceRefBlockModel;
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
  'affine:frame': typeof FrameBlockSchema;
  'affine:database': typeof DatabaseBlockSchema;
  'affine:data-view': typeof DataViewBlockSchema;
  'affine:bookmark': typeof BookmarkBlockSchema;
  'affine:attachment': typeof AttachmentBlockSchema;
  'affine:html': typeof HtmlBlockSchema;
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
  model: BaseBlockModel | null,
  expected: Key
): model is Flavours<Writeable<Key>> {
  return !!model && expected.includes(model.flavour);
}

export function isInsideBlockByFlavour(
  page: Page,
  block: BaseBlockModel | string,
  flavour: string
): boolean {
  const parent = page.getParent(block);
  if (parent === null) {
    return false;
  }
  if (flavour === parent.flavour) {
    return true;
  }
  return isInsideBlockByFlavour(page, parent, flavour);
}
