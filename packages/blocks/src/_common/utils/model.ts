import type { BlockModel, Doc } from '@blocksuite/store';

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
  EmbedFigmaModel,
  EmbedGithubModel,
  EmbedHtmlModel,
  EmbedLinkedDocModel,
  EmbedLoomModel,
  EmbedSyncedDocModel,
  EmbedYoutubeModel,
  FrameBlockModel,
  FrameBlockSchema,
  ImageBlockModel,
  ImageBlockSchema,
  ListBlockModel,
  ListBlockSchema,
  NoteBlockModel,
  NoteBlockSchema,
  ParagraphBlockModel,
  ParagraphBlockSchema,
  PDFBlockModel,
  RootBlockModel,
  RootBlockSchema,
  SurfaceBlockModel,
  SurfaceBlockSchema,
  SurfaceRefBlockModel,
} from '../../index.js';

export type BlockModels = {
  'affine:paragraph': ParagraphBlockModel;
  'affine:page': RootBlockModel;
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
  'affine:embed-github': EmbedGithubModel;
  'affine:embed-youtube': EmbedYoutubeModel;
  'affine:embed-figma': EmbedFigmaModel;
  'affine:embed-linked-doc': EmbedLinkedDocModel;
  'affine:embed-synced-doc': EmbedSyncedDocModel;
  'affine:embed-html': EmbedHtmlModel;
  'affine:pdf': PDFBlockModel;
  'affine:embed-loom': EmbedLoomModel;
};

export type BlockSchemas = {
  'affine:paragraph': typeof ParagraphBlockSchema;
  'affine:page': typeof RootBlockSchema;
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

export function matchFlavours<Key extends (keyof BlockSuite.BlockModels)[]>(
  model: BlockModel | null,
  expected: Key
): model is BlockSuite.BlockModels[Key[number]] {
  return (
    !!model && expected.includes(model.flavour as keyof BlockSuite.BlockModels)
  );
}

export function isInsideBlockByFlavour(
  doc: Doc,
  block: BlockModel | string,
  flavour: string
): boolean {
  const parent = doc.getParent(block);
  if (parent === null) {
    return false;
  }
  if (flavour === parent.flavour) {
    return true;
  }
  return isInsideBlockByFlavour(doc, parent, flavour);
}
