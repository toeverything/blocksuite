/** Legacy entry used for AFFiNE ESM module compat */
/// <reference types="@blocksuite/global" />
// Import models only, the bundled file should not include anything else.
import type { BlockSchema } from '@blocksuite/store';
import type { z } from 'zod';

import {
  AttachmentBlockSchema,
  BookmarkBlockSchema,
  CodeBlockSchema,
  DividerBlockSchema,
  EmbedFigmaBlockSchema,
  EmbedGithubBlockSchema,
  EmbedHtmlBlockSchema,
  EmbedLinkedDocBlockSchema,
  EmbedLoomBlockSchema,
  EmbedSyncedDocBlockSchema,
  EmbedYoutubeBlockSchema,
  ImageBlockSchema,
  ListBlockSchema,
  ParagraphBlockSchema,
} from '@blocksuite/affine-model';

import { DataViewBlockSchema } from './data-view-block/data-view-model.js';
import { DatabaseBlockSchema } from './database-block/database-model.js';
import { EdgelessTextBlockSchema } from './edgeless-text/edgeless-text-model.js';
import { FrameBlockSchema } from './frame-block/frame-model.js';
import { NoteBlockSchema } from './note-block/note-model.js';
import { RootBlockSchema } from './root-block/root-model.js';
import { SurfaceBlockSchema } from './surface-block/surface-model.js';
import { SurfaceRefBlockSchema } from './surface-ref-block/surface-ref-model.js';

/** Built-in first party block models built for affine */
export const AffineSchemas: z.infer<typeof BlockSchema>[] = [
  CodeBlockSchema,
  ParagraphBlockSchema,
  RootBlockSchema,
  ListBlockSchema,
  NoteBlockSchema,
  DividerBlockSchema,
  ImageBlockSchema,
  SurfaceBlockSchema,
  BookmarkBlockSchema,
  FrameBlockSchema,
  DatabaseBlockSchema,
  SurfaceRefBlockSchema,
  DataViewBlockSchema,
  AttachmentBlockSchema,
  EmbedYoutubeBlockSchema,
  EmbedFigmaBlockSchema,
  EmbedGithubBlockSchema,
  EmbedHtmlBlockSchema,
  EmbedLinkedDocBlockSchema,
  EmbedSyncedDocBlockSchema,
  EmbedLoomBlockSchema,
  EdgelessTextBlockSchema,
];
