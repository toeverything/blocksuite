// Import models only, the bundled file should not include anything else.
import { DataViewBlockSchema } from '@labre/affine-block-data-view';
import { SurfaceBlockSchema } from '@labre/affine-block-surface';
import {
  AttachmentBlockSchema,
  BookmarkBlockSchema,
  CalloutBlockSchema,
  CodeBlockSchema,
  DatabaseBlockSchema,
  DividerBlockSchema,
  EdgelessTextBlockSchema,
  EmbedFigmaBlockSchema,
  EmbedGithubBlockSchema,
  EmbedHtmlBlockSchema,
  EmbedLinkedDocBlockSchema,
  EmbedLoomBlockSchema,
  EmbedSyncedDocBlockSchema,
  EmbedYoutubeBlockSchema,
  FrameBlockSchema,
  ImageBlockSchema,
  LatexBlockSchema,
  ListBlockSchema,
  NoteBlockSchema,
  ParagraphBlockSchema,
  RootBlockSchema,
  SurfaceRefBlockSchema,
  TableBlockSchema,
} from '@labre/affine-model';
import type { BlockSchema } from '@labre/store';
import type { z } from 'zod';

import { type BlockFlags, isBlockEnabled, type OptionalBlock } from './flags.js';

type AffineBlockSchema = z.infer<typeof BlockSchema>;

/**
 * First party block models built for affine, honoring block flags.
 * Omitted flags default to enabled; core blocks (root, surface, note,
 * paragraph) are always included. See {@link BlockFlags}.
 */
export function getAffineSchemas(flags?: BlockFlags): AffineBlockSchema[] {
  const on = (block: OptionalBlock) => isBlockEnabled(flags, block);
  return [
    ...(on('code') ? [CodeBlockSchema] : []),
    ParagraphBlockSchema,
    RootBlockSchema,
    ...(on('list') ? [ListBlockSchema] : []),
    NoteBlockSchema,
    ...(on('divider') ? [DividerBlockSchema] : []),
    ...(on('image') ? [ImageBlockSchema] : []),
    SurfaceBlockSchema,
    ...(on('bookmark') ? [BookmarkBlockSchema] : []),
    ...(on('frame') ? [FrameBlockSchema] : []),
    ...(on('database') ? [DatabaseBlockSchema] : []),
    ...(on('surface-ref') ? [SurfaceRefBlockSchema] : []),
    ...(on('data-view') ? [DataViewBlockSchema] : []),
    ...(on('attachment') ? [AttachmentBlockSchema] : []),
    ...(on('embed')
      ? [
          EmbedYoutubeBlockSchema,
          EmbedFigmaBlockSchema,
          EmbedGithubBlockSchema,
          EmbedHtmlBlockSchema,
        ]
      : []),
    ...(on('embed-doc')
      ? [EmbedLinkedDocBlockSchema, EmbedSyncedDocBlockSchema]
      : []),
    ...(on('embed') ? [EmbedLoomBlockSchema] : []),
    ...(on('edgeless-text') ? [EdgelessTextBlockSchema] : []),
    ...(on('latex') ? [LatexBlockSchema] : []),
    ...(on('table') ? [TableBlockSchema] : []),
    ...(on('callout') ? [CalloutBlockSchema] : []),
  ];
}

/** Built-in first party block models built for affine */
export const AffineSchemas: AffineBlockSchema[] = getAffineSchemas();
