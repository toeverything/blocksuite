import { AttachmentStoreExtension } from '@labre/affine-block-attachment/store';
import { BookmarkStoreExtension } from '@labre/affine-block-bookmark/store';
import { CalloutStoreExtension } from '@labre/affine-block-callout/store';
import { CodeStoreExtension } from '@labre/affine-block-code/store';
import { DataViewStoreExtension } from '@labre/affine-block-data-view/store';
import { DatabaseStoreExtension } from '@labre/affine-block-database/store';
import { DividerStoreExtension } from '@labre/affine-block-divider/store';
import { EdgelessTextStoreExtension } from '@labre/affine-block-edgeless-text/store';
import { EmbedStoreExtension } from '@labre/affine-block-embed/store';
import { EmbedDocStoreExtension } from '@labre/affine-block-embed-doc/store';
import { FrameStoreExtension } from '@labre/affine-block-frame/store';
import { ImageStoreExtension } from '@labre/affine-block-image/store';
import { LatexStoreExtension } from '@labre/affine-block-latex/store';
import { ListStoreExtension } from '@labre/affine-block-list/store';
import { NoteStoreExtension } from '@labre/affine-block-note/store';
import { ParagraphStoreExtension } from '@labre/affine-block-paragraph/store';
import { RootStoreExtension } from '@labre/affine-block-root/store';
import { SurfaceStoreExtension } from '@labre/affine-block-surface/store';
import { SurfaceRefStoreExtension } from '@labre/affine-block-surface-ref/store';
import { TableStoreExtension } from '@labre/affine-block-table/store';
import { FoundationStoreExtension } from '@labre/affine-foundation/store';
import { BrushStoreExtension } from '@labre/affine-gfx-brush/store';
import { ConnectorStoreExtension } from '@labre/affine-gfx-connector/store';
import { GroupStoreExtension } from '@labre/affine-gfx-group/store';
import { MindmapStoreExtension } from '@labre/affine-gfx-mindmap/store';
import { ShapeStoreExtension } from '@labre/affine-gfx-shape/store';
import { TextStoreExtension } from '@labre/affine-gfx-text/store';
import { FootnoteStoreExtension } from '@labre/affine-inline-footnote/store';
import { LatexStoreExtension as InlineLatexStoreExtension } from '@labre/affine-inline-latex/store';
import { LinkStoreExtension } from '@labre/affine-inline-link/store';
import { InlinePresetStoreExtension } from '@labre/affine-inline-preset/store';
import { ReferenceStoreExtension } from '@labre/affine-inline-reference/store';

import {
  type BlockFlags,
  isBlockEnabled,
  type OptionalBlock,
} from '../flags.js';

/**
 * Store extensions, honoring block flags.
 * Omitted flags default to enabled. See {@link BlockFlags}.
 */
export function getInternalStoreExtensions(flags?: BlockFlags) {
  const on = (block: OptionalBlock) => isBlockEnabled(flags, block);
  return [
    FoundationStoreExtension,

    ...(on('attachment') ? [AttachmentStoreExtension] : []),
    ...(on('bookmark') ? [BookmarkStoreExtension] : []),
    ...(on('callout') ? [CalloutStoreExtension] : []),
    ...(on('code') ? [CodeStoreExtension] : []),
    ...(on('data-view') ? [DataViewStoreExtension] : []),
    ...(on('database') ? [DatabaseStoreExtension] : []),
    ...(on('divider') ? [DividerStoreExtension] : []),
    ...(on('edgeless-text') ? [EdgelessTextStoreExtension] : []),
    ...(on('embed') ? [EmbedStoreExtension] : []),
    ...(on('embed-doc') ? [EmbedDocStoreExtension] : []),
    ...(on('frame') ? [FrameStoreExtension] : []),
    ...(on('image') ? [ImageStoreExtension] : []),
    ...(on('latex') ? [LatexStoreExtension] : []),
    ...(on('list') ? [ListStoreExtension] : []),
    NoteStoreExtension,
    ParagraphStoreExtension,
    ...(on('surface-ref') ? [SurfaceRefStoreExtension] : []),
    ...(on('table') ? [TableStoreExtension] : []),
    SurfaceStoreExtension,
    RootStoreExtension,

    FootnoteStoreExtension,
    LinkStoreExtension,
    ReferenceStoreExtension,
    ...(on('latex') ? [InlineLatexStoreExtension] : []),
    InlinePresetStoreExtension,

    ...(on('brush') ? [BrushStoreExtension] : []),
    ShapeStoreExtension,
    ...(on('mindmap') ? [MindmapStoreExtension] : []),
    ConnectorStoreExtension,
    GroupStoreExtension,
    TextStoreExtension,
  ];
}
