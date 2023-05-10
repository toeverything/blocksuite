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
} from '../index.js';

export const pagePreset = new Map<BlockSchemaType, StaticValue>([
  [PageBlockSchema, literal`affine-default-page`],
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
  [FrameBlockSchema, literal`affine-frame`],
  [ParagraphBlockSchema, literal`affine-paragraph`],
]);
