import type { BlockSchemaType } from '@blocksuite/store';
import type { StaticValue } from 'lit/static-html.js';
import { literal } from 'lit/static-html.js';

import { BookmarkBlockSchema } from '../bookmark-block/index.js';
import { CodeBlockSchema } from '../code-block/code-model.js';
import { DatabaseBlockSchema } from '../database-block/database-model.js';
import { DividerBlockSchema } from '../divider-block/divider-model.js';
import { EmbedBlockSchema } from '../embed-block/embed-model.js';
import { FrameBlockSchema } from '../frame-block/frame-model.js';
import { ListBlockSchema } from '../list-block/list-model.js';
import { PageBlockSchema } from '../page-block/page-model.js';
import { ParagraphBlockSchema } from '../paragraph-block/paragraph-model.js';
import { SurfaceBlockSchema } from '../surface-block/surface-model.js';

export const pagePreset = new Map<BlockSchemaType, StaticValue>([
  [PageBlockSchema, literal`affine-default-page`],
  [SurfaceBlockSchema, literal`affine-surface`],
  [ListBlockSchema, literal`affine-list`],
  [FrameBlockSchema, literal`affine-frame`],
  [DatabaseBlockSchema, literal`affine-database`],
  [DividerBlockSchema, literal`affine-divider`],
  [CodeBlockSchema, literal`affine-code`],
  [EmbedBlockSchema, literal`affine-embed`],
  [ParagraphBlockSchema, literal`affine-paragraph`],
  [BookmarkBlockSchema, literal`affine-bookmark`],
]);

export const edgelessPreset = new Map<BlockSchemaType, StaticValue>([
  [PageBlockSchema, literal`affine-edgeless-page`],
  [SurfaceBlockSchema, literal`affine-surface`],
  [ListBlockSchema, literal`affine-list`],
  [FrameBlockSchema, literal`affine-frame`],
  [DatabaseBlockSchema, literal`affine-database`],
  [DividerBlockSchema, literal`affine-divider`],
  [CodeBlockSchema, literal`affine-code`],
  [EmbedBlockSchema, literal`affine-embed`],
  [ParagraphBlockSchema, literal`affine-paragraph`],
  [BookmarkBlockSchema, literal`affine-bookmark`],
]);
