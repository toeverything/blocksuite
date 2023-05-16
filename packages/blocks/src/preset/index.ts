import type { BlockSchemaType } from '@blocksuite/store';
import type { StaticValue } from 'lit/static-html.js';
import { literal } from 'lit/static-html.js';

import {
  CodeBlockSchema,
  DatabaseBlockSchema,
  DividerBlockSchema,
  EmbedBlockSchema,
  FrameBlockSchema,
  ListBlockSchema,
  PageBlockSchema,
  ParagraphBlockSchema,
  SurfaceBlockSchema,
} from '../index.js';

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
]);
