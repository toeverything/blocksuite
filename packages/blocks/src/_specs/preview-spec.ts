import type { BlockSpec } from '@blocksuite/block-std';
import { literal, unsafeStatic } from 'lit/static-html.js';

// import { AFFINE_BLOCK_HUB_WIDGET } from '../root-block/widgets/block-hub/block-hub.js';
import { AttachmentBlockSchema } from '../attachment-block/attachment-model.js';
import { AttachmentService } from '../attachment-block/attachment-service.js';
import { BookmarkService } from '../bookmark-block/bookmark-service.js';
import { BookmarkBlockSchema } from '../bookmark-block/index.js';
import { CodeBlockSchema } from '../code-block/code-model.js';
import { DataViewBlockSchema } from '../data-view-block/index.js';
import { DatabaseBlockSchema } from '../database-block/database-model.js';
import { DatabaseService } from '../database-block/database-service.js';
import { DividerBlockSchema } from '../divider-block/divider-model.js';
import { EmbedFigmaBlockSpec } from '../embed-figma-block/embed-figma-spec.js';
import { EmbedGithubBlockSpec } from '../embed-github-block/index.js';
import { EmbedHtmlBlockSpec } from '../embed-html-block/embed-html-spec.js';
import { EmbedLinkedDocBlockSpec } from '../embed-linked-doc-block/embed-linked-doc-spec.js';
import { EmbedLoomBlockSpec } from '../embed-loom-block/embed-loom-spec.js';
import { EmbedSyncedDocBlockSpec } from '../embed-synced-doc-block/embed-synced-doc-spec.js';
import { EmbedYoutubeBlockSpec } from '../embed-youtube-block/embed-youtube-spec.js';
import { ImageBlockSchema } from '../image-block/image-model.js';
import { ImageService } from '../image-block/index.js';
import { ListBlockSchema } from '../list-block/list-model.js';
import { ListService } from '../list-block/list-service.js';
import { NoteBlockSchema } from '../note-block/note-model.js';
import { NoteService } from '../note-block/note-service.js';
import { ParagraphBlockSchema } from '../paragraph-block/paragraph-model.js';
import { ParagraphService } from '../paragraph-block/paragraph-service.js';
import { PageRootService } from '../root-block/page/page-root-service.js';
import { RootBlockSchema } from '../root-block/root-model.js';
import { EMBED_CARD_TOOLBAR } from '../root-block/widgets/embed-card-toolbar/embed-card-toolbar.js';
import { SurfaceBlockSchema } from '../surface-block/surface-model.js';
import { SurfacePageService } from '../surface-block/surface-page-service.js';
import {
  SurfaceRefBlockSchema,
  SurfaceRefBlockService,
} from '../surface-ref-block/index.js';

const PreviewPageSpec: BlockSpec = {
  schema: RootBlockSchema,
  service: PageRootService,
  view: {
    component: literal`affine-preview-root`,
  },
};

const CommonFirstPartyBlockSpecs: BlockSpec[] = [
  {
    schema: ListBlockSchema,
    view: {
      component: literal`affine-list`,
    },
    service: ListService,
  },
  {
    schema: NoteBlockSchema,
    service: NoteService,
    view: {
      component: literal`affine-note`,
    },
  },
  {
    schema: DatabaseBlockSchema,
    service: DatabaseService,
    view: {
      component: literal`affine-database`,
    },
  },
  {
    schema: DataViewBlockSchema,
    view: {
      component: literal`affine-data-view`,
    },
  },
  {
    schema: DividerBlockSchema,
    view: {
      component: literal`affine-divider`,
    },
  },
  {
    schema: CodeBlockSchema,
    view: {
      component: literal`affine-code`,
    },
  },
  {
    schema: ImageBlockSchema,
    service: ImageService,
    view: {
      component: literal`affine-image`,
      widgets: {
        imageToolbar: literal`affine-image-toolbar-widget`,
      },
    },
  },
  {
    schema: ParagraphBlockSchema,
    view: {
      component: literal`affine-paragraph`,
    },
    service: ParagraphService,
  },
  {
    schema: BookmarkBlockSchema,
    view: {
      component: literal`affine-bookmark`,
      widgets: {
        [EMBED_CARD_TOOLBAR]: literal`${unsafeStatic(EMBED_CARD_TOOLBAR)}`,
      },
    },
    service: BookmarkService,
  },
  {
    schema: AttachmentBlockSchema,
    view: {
      component: literal`affine-attachment`,
    },
    service: AttachmentService,
  },
  EmbedFigmaBlockSpec,
  EmbedGithubBlockSpec,
  EmbedYoutubeBlockSpec,
  EmbedLoomBlockSpec,
  EmbedHtmlBlockSpec,
  EmbedSyncedDocBlockSpec,
  EmbedLinkedDocBlockSpec,
];

export const PreviewEditorBlockSpecs: BlockSpec[] = [
  PreviewPageSpec,
  ...CommonFirstPartyBlockSpecs,
  {
    schema: SurfaceBlockSchema,
    service: SurfacePageService,
    view: {
      component: literal`affine-surface`,
    },
  },
  {
    schema: SurfaceRefBlockSchema,
    service: SurfaceRefBlockService,
    view: {
      component: literal`affine-preview-surface-ref`,
    },
  },
];
