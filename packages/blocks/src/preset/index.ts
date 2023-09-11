import type { LitBlockSpec } from '@blocksuite/lit';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { AttachmentBlockSchema } from '../attachment-block/attachment-model.js';
import { BookmarkBlockSchema } from '../bookmark-block/index.js';
import { CodeBlockSchema } from '../code-block/code-model.js';
import { DataViewBlockSchema } from '../data-view-block/index.js';
import { DatabaseBlockSchema } from '../database-block/database-model.js';
import { DatabaseService } from '../database-block/database-service.js';
import { DividerBlockSchema } from '../divider-block/divider-model.js';
import { ImageBlockSchema } from '../image-block/image-model.js';
import { ImageService } from '../image-block/index.js';
import { ListBlockSchema } from '../list-block/list-model.js';
import { NoteBlockSchema } from '../note-block/note-model.js';
import { DocPageService } from '../page-block/doc/doc-page-service.js';
import { EdgelessPageService } from '../page-block/edgeless/edgeless-page-service.js';
import {
  type DocPageBlockWidgetName,
  type EdgelessPageBlockWidgetName,
} from '../page-block/index.js';
import { PageBlockSchema } from '../page-block/page-model.js';
import { ParagraphBlockSchema } from '../paragraph-block/paragraph-model.js';
import { SurfaceBlockSchema } from '../surface-block/surface-model.js';
import { AFFINE_FORMAT_BAR_WIDGET_TAG } from '../widgets/format-bar/format-bar.js';
import { AFFINE_REMOTE_SELECTION_WIDGET_TAG } from '../widgets/remote-selection/remote-selection.js';

const pageBlockSpec: LitBlockSpec<DocPageBlockWidgetName> = {
  schema: PageBlockSchema,
  service: DocPageService,
  view: {
    component: literal`affine-doc-page`,
    widgets: {
      modal: literal`affine-modal-widget`,
      imageToolbar: literal`affine-image-toolbar-widget`,
      slashMenu: literal`affine-slash-menu-widget`,
      linkedPage: literal`affine-linked-page-widget`,
      draggingArea: literal`affine-doc-dragging-area-widget`,
      dragHandle: literal`affine-drag-handle-widget`,
      [AFFINE_FORMAT_BAR_WIDGET_TAG]: literal`${unsafeStatic(
        AFFINE_FORMAT_BAR_WIDGET_TAG
      )}`,
      [AFFINE_REMOTE_SELECTION_WIDGET_TAG]: literal`${unsafeStatic(
        AFFINE_REMOTE_SELECTION_WIDGET_TAG
      )}`,
    },
  },
};

const edgelessBlockSpec: LitBlockSpec<EdgelessPageBlockWidgetName> = {
  schema: PageBlockSchema,
  service: EdgelessPageService,
  view: {
    component: literal`affine-edgeless-page`,
    widgets: {
      modal: literal`affine-modal-widget`,
      imageToolbar: literal`affine-image-toolbar-widget`,
      slashMenu: literal`affine-slash-menu-widget`,
      linkedPage: literal`affine-linked-page-widget`,
      dragHandle: literal`affine-drag-handle-widget`,
      [AFFINE_FORMAT_BAR_WIDGET_TAG]: literal`${unsafeStatic(
        AFFINE_FORMAT_BAR_WIDGET_TAG
      )}`,
      [AFFINE_REMOTE_SELECTION_WIDGET_TAG]: literal`${unsafeStatic(
        AFFINE_REMOTE_SELECTION_WIDGET_TAG
      )}`,
      remoteSelection: literal`affine-edgelss-remote-selection-widget`,
    },
  },
};

export const pagePreset: LitBlockSpec[] = [
  pageBlockSpec,
  {
    schema: SurfaceBlockSchema,
    view: {
      component: literal`affine-surface`,
    },
  },
  {
    schema: ListBlockSchema,
    view: {
      component: literal`affine-list`,
    },
  },
  {
    schema: NoteBlockSchema,
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
  },
  {
    schema: AttachmentBlockSchema,
    view: {
      component: literal`affine-attachment`,
    },
  },
];

export const edgelessPreset: LitBlockSpec[] = [
  edgelessBlockSpec,
  {
    schema: SurfaceBlockSchema,
    view: {
      component: literal`affine-surface`,
    },
  },
  {
    schema: ListBlockSchema,
    view: {
      component: literal`affine-list`,
    },
  },
  {
    schema: NoteBlockSchema,
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
  },
  {
    schema: AttachmentBlockSchema,
    view: {
      component: literal`affine-attachment`,
    },
  },
];
