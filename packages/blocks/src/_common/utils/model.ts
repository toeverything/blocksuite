import type { BaseBlockModel, Page } from '@blocksuite/store';

import {
  type AttachmentBlockModel,
  type AttachmentBlockSchema,
  type BookmarkBlockModel,
  type BookmarkBlockSchema,
  type CodeBlockModel,
  type CodeBlockSchema,
  type DatabaseBlockModel,
  type DatabaseBlockSchema,
  type DataViewBlockModel,
  type DataViewBlockSchema,
  type DividerBlockModel,
  type DividerBlockSchema,
  type FrameBlockModel,
  type FrameBlockSchema,
  type ImageBlockModel,
  type ImageBlockSchema,
  type ListBlockModel,
  type ListBlockSchema,
  type NoteBlockModel,
  type NoteBlockSchema,
  type PageBlockModel,
  type PageBlockSchema,
  type ParagraphBlockModel,
  type ParagraphBlockSchema,
  type SurfaceBlockModel,
  type SurfaceBlockSchema,
  type SurfaceRefBlockModel,
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
};

export type BlockModelProps = {
  [K in keyof BlockSchemas]: ReturnType<BlockSchemas[K]['model']['props']>;
};

export function assertFlavours(model: { flavour: string }, allowed: string[]) {
  if (!allowed.includes(model.flavour)) {
    throw new Error(`model flavour ${model.flavour} is not allowed`);
  }
}

export function matchFlavours<Key extends (keyof BlockModels)[]>(
  model: BaseBlockModel | null,
  expected: Key
): model is BlockModels[Key[number]] {
  return !!model && expected.includes(model.flavour as keyof BlockModels);
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
