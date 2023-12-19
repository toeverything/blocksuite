import type { BlockSpec } from '@blocksuite/block-std';
import { literal, unsafeStatic } from 'lit/static-html.js';

// import { AFFINE_BLOCK_HUB_WIDGET } from '../_common/widgets/block-hub/index.js';
import { AttachmentBlockSchema } from '../attachment-block/attachment-model.js';
import { AttachmentService } from '../attachment-block/attachment-service.js';
import { BookmarkService } from '../bookmark-block/bookmark-service.js';
import { BookmarkBlockSchema } from '../bookmark-block/index.js';
import { CodeBlockSchema } from '../code-block/code-model.js';
import { DataViewBlockSchema } from '../data-view-block/index.js';
import { DatabaseBlockSchema } from '../database-block/database-model.js';
import { DatabaseService } from '../database-block/database-service.js';
import { DividerBlockSchema } from '../divider-block/divider-model.js';
import { EmbedGithubBlockSpec } from '../embed-github-block/index.js';
import { EmbedHtmlBlockSpec } from '../embed-html-block/embed-html-spec.js';
import { FrameBlockSchema } from '../frame-block/index.js';
import { ImageBlockSchema } from '../image-block/image-model.js';
import { ImageService } from '../image-block/index.js';
import { ListBlockSchema } from '../list-block/list-model.js';
import { NoteService } from '../note-block/index.js';
import { NoteBlockSchema } from '../note-block/note-model.js';
import { DocPageService } from '../page-block/doc/doc-page-service.js';
import { EdgelessPageService } from '../page-block/edgeless/edgeless-page-service.js';
import {
  type DocPageBlockWidgetName,
  type EdgelessPageBlockWidgetName,
} from '../page-block/index.js';
import { PageBlockSchema } from '../page-block/page-model.js';
import { AFFINE_DOC_DRAGGING_AREA_WIDGET } from '../page-block/widgets/doc-dragging-area/doc-dragging-area.js';
import { AFFINE_DOC_REMOTE_SELECTION_WIDGET } from '../page-block/widgets/doc-remote-selection/doc-remote-selection.js';
import { AFFINE_DRAG_HANDLE_WIDGET } from '../page-block/widgets/drag-handle/drag-handle.js';
import { AFFINE_EDGELESS_REMOTE_SELECTION_WIDGET } from '../page-block/widgets/edgeless-remote-selection/index.js';
import { AFFINE_FORMAT_BAR_WIDGET } from '../page-block/widgets/format-bar/format-bar.js';
import { AFFINE_LINKED_PAGE_WIDGET } from '../page-block/widgets/linked-page/index.js';
import { AFFINE_MODAL_WIDGET } from '../page-block/widgets/modal/modal.js';
import { AFFINE_SLASH_MENU_WIDGET } from '../page-block/widgets/slash-menu/index.js';
import { ParagraphBlockSchema } from '../paragraph-block/paragraph-model.js';
import { SurfaceBlockSchema } from '../surface-block/surface-model.js';
import { SurfaceService } from '../surface-block/surface-service.js';
import { SurfaceRefBlockSchema } from '../surface-ref-block/index.js';

const DocPageSpec: BlockSpec<DocPageBlockWidgetName> = {
  schema: PageBlockSchema,
  service: DocPageService,
  view: {
    component: literal`affine-doc-page`,
    widgets: {
      // [AFFINE_BLOCK_HUB_WIDGET]: literal`${unsafeStatic(
      //   AFFINE_BLOCK_HUB_WIDGET
      // )}`,
      [AFFINE_MODAL_WIDGET]: literal`${unsafeStatic(AFFINE_MODAL_WIDGET)}`,
      [AFFINE_SLASH_MENU_WIDGET]: literal`${unsafeStatic(
        AFFINE_SLASH_MENU_WIDGET
      )}`,
      [AFFINE_LINKED_PAGE_WIDGET]: literal`${unsafeStatic(
        AFFINE_LINKED_PAGE_WIDGET
      )}`,
      [AFFINE_DOC_DRAGGING_AREA_WIDGET]: literal`${unsafeStatic(
        AFFINE_DOC_DRAGGING_AREA_WIDGET
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
    },
  },
};

const EdgelessPageSpec: BlockSpec<EdgelessPageBlockWidgetName> = {
  schema: PageBlockSchema,
  service: EdgelessPageService,
  view: {
    component: literal`affine-edgeless-page`,
    widgets: {
      // [AFFINE_BLOCK_HUB_WIDGET]: literal`${unsafeStatic(
      //   AFFINE_BLOCK_HUB_WIDGET
      // )}`,
      [AFFINE_MODAL_WIDGET]: literal`${unsafeStatic(AFFINE_MODAL_WIDGET)}`,
      [AFFINE_SLASH_MENU_WIDGET]: literal`${unsafeStatic(
        AFFINE_SLASH_MENU_WIDGET
      )}`,
      [AFFINE_LINKED_PAGE_WIDGET]: literal`${unsafeStatic(
        AFFINE_LINKED_PAGE_WIDGET
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
    },
  },
};

const CommonFirstPartyBlockSpecs: BlockSpec[] = [
  {
    schema: SurfaceBlockSchema,
    view: {
      component: literal`affine-surface`,
    },
    service: SurfaceService,
  },
  {
    schema: ListBlockSchema,
    view: {
      component: literal`affine-list`,
    },
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
  {
    schema: SurfaceRefBlockSchema,
    view: {
      component: literal`affine-surface-ref`,
      widgets: {
        surfaceToolbar: literal`affine-surface-ref-toolbar`,
      },
    },
  },
  EmbedGithubBlockSpec,
  EmbedHtmlBlockSpec,
];

export const DocEditorBlockSpecs: BlockSpec[] = [
  DocPageSpec,
  ...CommonFirstPartyBlockSpecs,
];

export const EdgelessEditorBlockSpecs: BlockSpec[] = [
  EdgelessPageSpec,
  ...CommonFirstPartyBlockSpecs,
  {
    schema: FrameBlockSchema,
    view: {
      component: literal`affine-frame`,
    },
  },
];
