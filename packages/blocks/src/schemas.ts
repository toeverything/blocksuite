/** Legacy entry used for AFFiNE ESM module compat */
/// <reference types="@blocksuite/global" />
// Import models only, the bundled file should not include anything else.
import type { BlockSchema } from '@blocksuite/store';
import type { z } from 'zod';

import { AttachmentBlockSchema } from './attachment-block/attachment-model.js';
import { BookmarkBlockSchema } from './bookmark-block/bookmark-model.js';
import { CodeBlockSchema } from './code-block/code-model.js';
import { DataViewBlockSchema } from './data-view-block/data-view-model.js';
import { DatabaseBlockSchema } from './database-block/database-model.js';
import { DividerBlockSchema } from './divider-block/divider-model.js';
import { EdgelessTextBlockSchema } from './edgeless-text/edgeless-text-model.js';
import { EmbedFigmaBlockSchema } from './embed-figma-block/embed-figma-schema.js';
import { EmbedGithubBlockSchema } from './embed-github-block/embed-github-schema.js';
import { EmbedHtmlBlockSchema } from './embed-html-block/embed-html-schema.js';
import { EmbedLinkedDocBlockSchema } from './embed-linked-doc-block/embed-linked-doc-schema.js';
import { EmbedLoomBlockSchema } from './embed-loom-block/embed-loom-schema.js';
import { EmbedSyncedDocBlockSchema } from './embed-synced-doc-block/embed-synced-doc-schema.js';
import { EmbedYoutubeBlockSchema } from './embed-youtube-block/embed-youtube-schema.js';
import { FrameBlockSchema } from './frame-block/frame-model.js';
import { ImageBlockSchema } from './image-block/image-model.js';
import { ListBlockSchema } from './list-block/list-model.js';
import { NoteBlockSchema } from './note-block/note-model.js';
import { ParagraphBlockSchema } from './paragraph-block/paragraph-model.js';
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
