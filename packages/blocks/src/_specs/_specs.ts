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
import { FrameBlockSchema } from '../frame-block/frame-model.js';
import { ImageBlockSchema } from '../image-block/image-model.js';
import { ImageService } from '../image-block/index.js';
import { ListBlockSchema } from '../list-block/list-model.js';
import { ListService } from '../list-block/list-service.js';
import { NoteService } from '../note-block/index.js';
import { NoteBlockSchema } from '../note-block/note-model.js';
import { ParagraphBlockSchema } from '../paragraph-block/paragraph-model.js';
import { ParagraphService } from '../paragraph-block/paragraph-service.js';
import { EdgelessRootService } from '../root-block/edgeless/edgeless-root-service.js';
import {
  type EdgelessRootBlockWidgetName,
  type PageRootBlockWidgetName,
} from '../root-block/index.js';
import { PageRootService } from '../root-block/page/page-root-service.js';
import { RootBlockSchema } from '../root-block/root-model.js';
import { AFFINE_DOC_REMOTE_SELECTION_WIDGET } from '../root-block/widgets/doc-remote-selection/doc-remote-selection.js';
import { AFFINE_DRAG_HANDLE_WIDGET } from '../root-block/widgets/drag-handle/drag-handle.js';
import { AFFINE_EDGELESS_AI_WIDGET } from '../root-block/widgets/edgeless-ai-selection/index.js';
import { AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET } from '../root-block/widgets/edgeless-remote-selection/index.js';
import { AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET } from '../root-block/widgets/edgeless-zoom-toolbar/index.js';
import { AFFINE_FORMAT_BAR_WIDGET } from '../root-block/widgets/format-bar/format-bar.js';
import { AFFINE_LINKED_DOC_WIDGET } from '../root-block/widgets/linked-doc/index.js';
import { AFFINE_MODAL_WIDGET } from '../root-block/widgets/modal/modal.js';
import { AFFINE_PAGE_DRAGGING_AREA_WIDGET } from '../root-block/widgets/page-dragging-area/page-dragging-area.js';
import { AFFINE_PIE_MENU_WIDGET } from '../root-block/widgets/pie-menu/index.js';
import { AFFINE_SLASH_MENU_WIDGET } from '../root-block/widgets/slash-menu/index.js';
import { SurfaceBlockSchema } from '../surface-block/surface-model.js';
import { SurfacePageService } from '../surface-block/surface-page-service.js';
import { SurfaceService } from '../surface-block/surface-service.js';
import {
  SurfaceRefBlockSchema,
  SurfaceRefBlockService,
} from '../surface-ref-block/index.js';

const DocPageSpec: BlockSpec<PageRootBlockWidgetName> = {
  schema: RootBlockSchema,
  service: PageRootService,
  view: {
    component: literal`affine-page-root`,
    widgets: {
      // [AFFINE_BLOCK_HUB_WIDGET]: literal`${unsafeStatic(
      //   AFFINE_BLOCK_HUB_WIDGET
      // )}`,
      [AFFINE_MODAL_WIDGET]: literal`${unsafeStatic(AFFINE_MODAL_WIDGET)}`,
      [AFFINE_SLASH_MENU_WIDGET]: literal`${unsafeStatic(
        AFFINE_SLASH_MENU_WIDGET
      )}`,
      [AFFINE_LINKED_DOC_WIDGET]: literal`${unsafeStatic(
        AFFINE_LINKED_DOC_WIDGET
      )}`,
      [AFFINE_DRAG_HANDLE_WIDGET]: literal`${unsafeStatic(
        AFFINE_DRAG_HANDLE_WIDGET
      )}`,
      [AFFINE_FORMAT_BAR_WIDGET]: literal`${unsafeStatic(
        AFFINE_FORMAT_BAR_WIDGET
      )}`,
      [AFFINE_DOC_REMOTE_SELECTION_WIDGET]: literal`${unsafeStatic(
        AFFINE_DOC_REMOTE_SELECTION_WIDGET
      )}`,
      [AFFINE_PAGE_DRAGGING_AREA_WIDGET]: literal`${unsafeStatic(
        AFFINE_PAGE_DRAGGING_AREA_WIDGET
      )}`,
    },
  },
};

const EdgelessPageSpec: BlockSpec<EdgelessRootBlockWidgetName> = {
  schema: RootBlockSchema,
  service: EdgelessRootService,
  view: {
    component: literal`affine-edgeless-root`,
    widgets: {
      // [AFFINE_BLOCK_HUB_WIDGET]: literal`${unsafeStatic(
      //   AFFINE_BLOCK_HUB_WIDGET
      // )}`,
      [AFFINE_MODAL_WIDGET]: literal`${unsafeStatic(AFFINE_MODAL_WIDGET)}`,
      [AFFINE_PIE_MENU_WIDGET]: literal`${unsafeStatic(AFFINE_PIE_MENU_WIDGET)}`,
      [AFFINE_SLASH_MENU_WIDGET]: literal`${unsafeStatic(
        AFFINE_SLASH_MENU_WIDGET
      )}`,
      [AFFINE_LINKED_DOC_WIDGET]: literal`${unsafeStatic(
        AFFINE_LINKED_DOC_WIDGET
      )}`,
      [AFFINE_DRAG_HANDLE_WIDGET]: literal`${unsafeStatic(
        AFFINE_DRAG_HANDLE_WIDGET
      )}`,
      [AFFINE_FORMAT_BAR_WIDGET]: literal`${unsafeStatic(
        AFFINE_FORMAT_BAR_WIDGET
      )}`,
      [AFFINE_DOC_REMOTE_SELECTION_WIDGET]: literal`${unsafeStatic(
        AFFINE_DOC_REMOTE_SELECTION_WIDGET
      )}`,
      [AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET]: literal`${unsafeStatic(
        AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET
      )}`,
      [AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET]: literal`${unsafeStatic(
        AFFINE_EDGELESS_ZOOM_TOOLBAR_WIDGET
      )}`,
      [AFFINE_EDGELESS_AI_WIDGET]: literal`${unsafeStatic(AFFINE_EDGELESS_AI_WIDGET)}`,
    },
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
  EmbedYoutubeBlockSpec,
  EmbedGithubBlockSpec,
  EmbedHtmlBlockSpec,
  EmbedLinkedDocBlockSpec,
  EmbedSyncedDocBlockSpec,
  EmbedLoomBlockSpec,
];

export const PageEditorBlockSpecs: BlockSpec[] = [
  DocPageSpec,
  ...CommonFirstPartyBlockSpecs,
  {
    schema: SurfaceBlockSchema,
    view: {
      component: literal`affine-surface`,
    },
    service: SurfacePageService,
  },
  {
    schema: SurfaceRefBlockSchema,
    service: SurfaceRefBlockService,
    view: {
      component: literal`affine-surface-ref`,
      widgets: {
        surfaceToolbar: literal`affine-surface-ref-toolbar`,
      },
    },
  },
];

export const EdgelessEditorBlockSpecs: BlockSpec[] = [
  EdgelessPageSpec,
  ...CommonFirstPartyBlockSpecs,
  {
    schema: SurfaceBlockSchema,
    view: {
      component: literal`affine-surface`,
    },
    service: SurfaceService,
  },
  {
    schema: FrameBlockSchema,
    view: {
      component: literal`affine-frame`,
    },
  },
  {
    schema: SurfaceRefBlockSchema,
    service: SurfaceRefBlockService,
    view: {
      component: literal`affine-edgeless-surface-ref`,
    },
  },
];
