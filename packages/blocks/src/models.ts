/// <reference types="@blocksuite/global" />
// Import models only, the bundled file should not include anything else.
import type { BlockSchema } from '@blocksuite/store';
import type { z } from 'zod';

import type { BookmarkBlockModel } from './bookmark-block/bookmark-model.js';
import { BookmarkBlockSchema } from './bookmark-block/bookmark-model.js';
import {
  type CodeBlockModel,
  CodeBlockSchema,
} from './code-block/code-model.js';
import type { DataViewBlockModel } from './data-view-block/index.js';
import { DataViewBlockSchema } from './data-view-block/index.js';
import type { DatabaseBlockModel } from './database-block/database-model.js';
import { DatabaseBlockSchema } from './database-block/database-model.js';
import type { DividerBlockModel } from './divider-block/divider-model.js';
import { DividerBlockSchema } from './divider-block/divider-model.js';
import type { ImageBlockModel } from './image-block/image-model.js';
import { ImageBlockSchema } from './image-block/image-model.js';
import type { ListBlockModel } from './list-block/list-model.js';
import { ListBlockSchema } from './list-block/list-model.js';
import type { NoteBlockModel } from './note-block/note-model.js';
import { NoteBlockSchema } from './note-block/note-model.js';
import type { PageBlockModel } from './page-block/page-model.js';
import { PageBlockSchema } from './page-block/page-model.js';
import type { ParagraphBlockModel } from './paragraph-block/paragraph-model.js';
import { ParagraphBlockSchema } from './paragraph-block/paragraph-model.js';
import type { SurfaceBlockModel } from './surface-block/surface-model.js';
import { SurfaceBlockSchema } from './surface-block/surface-model.js';

export type {
  BookmarkBlockModel,
  CodeBlockModel,
  DatabaseBlockModel,
  DividerBlockModel,
  ImageBlockModel,
  ListBlockModel,
  NoteBlockModel,
  PageBlockModel,
  ParagraphBlockModel,
  SurfaceBlockModel,
};

/** Built-in first party block models built for affine */
export const AffineSchemas: z.infer<typeof BlockSchema>[] = [
  CodeBlockSchema,
  ParagraphBlockSchema,
  PageBlockSchema,
  ListBlockSchema,
  NoteBlockSchema,
  DividerBlockSchema,
  ImageBlockSchema,
  SurfaceBlockSchema,
  BookmarkBlockSchema,
  // DatabaseBlockSchema,
];

export const __unstableSchemas = [
  DatabaseBlockSchema,
  DataViewBlockSchema,
] satisfies z.infer<typeof BlockSchema>[];

// TODO support dynamic register
export type BlockSchemas = {
  'affine:code': CodeBlockModel;
  'affine:paragraph': ParagraphBlockModel;
  'affine:page': PageBlockModel;
  'affine:list': ListBlockModel;
  'affine:note': NoteBlockModel;
  'affine:divider': DividerBlockModel;
  'affine:image': ImageBlockModel;
  'affine:surface': SurfaceBlockModel;
  'affine:database': DatabaseBlockModel;
  'affine:data-view': DataViewBlockModel;
  'affine:bookmark': BookmarkBlockModel;
};

export type Flavour = keyof BlockSchemas;
