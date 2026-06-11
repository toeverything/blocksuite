import { AttachmentStoreExtension } from '@blocksuite/affine-block-attachment/store';
import { BookmarkStoreExtension } from '@blocksuite/affine-block-bookmark/store';
import { CalloutStoreExtension } from '@blocksuite/affine-block-callout/store';
import { CodeStoreExtension } from '@blocksuite/affine-block-code/store';
import { DataViewStoreExtension } from '@blocksuite/affine-block-data-view/store';
import { DatabaseStoreExtension } from '@blocksuite/affine-block-database/store';
import { DividerStoreExtension } from '@blocksuite/affine-block-divider/store';
import { EdgelessTextStoreExtension } from '@blocksuite/affine-block-edgeless-text/store';
import { EmbedStoreExtension } from '@blocksuite/affine-block-embed/store';
import { EmbedDocStoreExtension } from '@blocksuite/affine-block-embed-doc/store';
import { FrameStoreExtension } from '@blocksuite/affine-block-frame/store';
import { ImageStoreExtension } from '@blocksuite/affine-block-image/store';
import { LatexStoreExtension } from '@blocksuite/affine-block-latex/store';
import { ListStoreExtension } from '@blocksuite/affine-block-list/store';
import { NoteStoreExtension } from '@blocksuite/affine-block-note/store';
import { ParagraphStoreExtension } from '@blocksuite/affine-block-paragraph/store';
import { RootStoreExtension } from '@blocksuite/affine-block-root/store';
import { SurfaceStoreExtension } from '@blocksuite/affine-block-surface/store';
import { SurfaceRefStoreExtension } from '@blocksuite/affine-block-surface-ref/store';
import { TableStoreExtension } from '@blocksuite/affine-block-table/store';
import { FoundationStoreExtension } from '@blocksuite/affine-foundation/store';
import { BrushStoreExtension } from '@blocksuite/affine-gfx-brush/store';
import { ConnectorStoreExtension } from '@blocksuite/affine-gfx-connector/store';
import { GroupStoreExtension } from '@blocksuite/affine-gfx-group/store';
import { MindmapStoreExtension } from '@blocksuite/affine-gfx-mindmap/store';
import { ShapeStoreExtension } from '@blocksuite/affine-gfx-shape/store';
import { TextStoreExtension } from '@blocksuite/affine-gfx-text/store';
import { FootnoteStoreExtension } from '@blocksuite/affine-inline-footnote/store';
import { LatexStoreExtension as InlineLatexStoreExtension } from '@blocksuite/affine-inline-latex/store';
import { LinkStoreExtension } from '@blocksuite/affine-inline-link/store';
import { InlinePresetStoreExtension } from '@blocksuite/affine-inline-preset/store';
import { ReferenceStoreExtension } from '@blocksuite/affine-inline-reference/store';

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
