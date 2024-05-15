import { AttachmentBlockSpec } from '../attachment-block/attachment-spec.js';
import { BookmarkBlockSpec } from '../bookmark-block/bookmark-spec.js';
import { CodeBlockSpec } from '../code-block/code-block-spec.js';
import { DataViewBlockSpec } from '../data-view-block/data-view-spec.js';
import { DatabaseBlockSpec } from '../database-block/database-spec.js';
import { DividerBlockSpec } from '../divider-block/divider-spec.js';
import { EmbedFigmaBlockSpec } from '../embed-figma-block/embed-figma-spec.js';
import { EmbedGithubBlockSpec } from '../embed-github-block/embed-github-spec.js';
import { EmbedHtmlBlockSpec } from '../embed-html-block/embed-html-spec.js';
import { EmbedLinkedDocBlockSpec } from '../embed-linked-doc-block/embed-linked-doc-spec.js';
import { EmbedLoomBlockSpec } from '../embed-loom-block/embed-loom-spec.js';
import { EmbedSyncedDocBlockSpec } from '../embed-synced-doc-block/embed-synced-doc-spec.js';
import { EmbedYoutubeBlockSpec } from '../embed-youtube-block/embed-youtube-spec.js';
import { FrameBlockSpec } from '../frame-block/frame-spec.js';
import { ImageBlockSpec } from '../image-block/image-spec.js';
import { ListBlockSpec } from '../list-block/list-spec.js';
import { NoteBlockSpec } from '../note-block/note-spec.js';
import { ParagraphBlockSpec } from '../paragraph-block/paragraph-spec.js';
import { EdgelessRootBlockSpec } from '../root-block/edgeless/edgeless-root-spec.js';
import { PageRootBlockSpec } from '../root-block/page/page-root-spec.js';
import { EdgelessSurfaceBlockSpec } from '../surface-block/surface-spec.js';
import { PageSurfaceBlockSpec } from '../surface-block/surface-spec.js';
import { EdgelessSurfaceRefBlockSpec } from '../surface-ref-block/surface-ref-spec.js';
import { PageSurfaceRefBlockSpec } from '../surface-ref-block/surface-ref-spec.js';
import { EdgelessEditorBlockSpecs } from './edgeless-specs.js';
import { PageEditorBlockSpecs } from './page-specs.js';
import { PreviewEditorBlockSpecs } from './preview-specs.js';
import { SpecProvider } from './utils/spec-provider.js';

SpecProvider.getInstance().addSpec('page', PageEditorBlockSpecs);
SpecProvider.getInstance().addSpec('edgeless', EdgelessEditorBlockSpecs);
SpecProvider.getInstance().addSpec('preview', PreviewEditorBlockSpecs);

// specs preset
export * from './edgeless-specs.js';
export * from './page-specs.js';
export * from './preview-specs.js';
export * from './utils/spec-builder.js';
export * from './utils/spec-provider.js';

// eslint-disable-next-line simple-import-sort/exports
export {
  // common
  AttachmentBlockSpec,
  BookmarkBlockSpec,
  CodeBlockSpec,
  DatabaseBlockSpec,
  DataViewBlockSpec,
  DividerBlockSpec,
  EmbedFigmaBlockSpec,
  EmbedGithubBlockSpec,
  EmbedHtmlBlockSpec,
  EmbedLinkedDocBlockSpec,
  EmbedLoomBlockSpec,
  EmbedSyncedDocBlockSpec,
  EmbedYoutubeBlockSpec,
  ImageBlockSpec,
  ListBlockSpec,
  NoteBlockSpec,
  ParagraphBlockSpec,
  // edgeless
  EdgelessRootBlockSpec,
  EdgelessSurfaceBlockSpec,
  EdgelessSurfaceRefBlockSpec,
  FrameBlockSpec,
  // page
  PageRootBlockSpec,
  PageSurfaceBlockSpec,
  PageSurfaceRefBlockSpec,
};
