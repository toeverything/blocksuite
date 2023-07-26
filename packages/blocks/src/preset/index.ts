import type { LitBlockSpec } from '@blocksuite/lit';
import { literal } from 'lit/static-html.js';

import { BookmarkBlockSchema } from '../bookmark-block/index.js';
import { CodeBlockSchema } from '../code-block/code-model.js';
import { DataViewBlockSchema } from '../data-view-block/index.js';
import { DatabaseBlockSchema } from '../database-block/database-model.js';
import { DividerBlockSchema } from '../divider-block/divider-model.js';
import { ImageBlockSchema } from '../image-block/image-model.js';
import { ListBlockSchema } from '../list-block/list-model.js';
import { NoteBlockSchema } from '../note-block/note-model.js';
import { DefaultPageService } from '../page-block/default/default-page-service.js';
import { EdgelessPageService } from '../page-block/edgeless/edgeless-page-service.js';
import {
  type DocPageBlockWidgetName,
  type EdgelessPageBlockWidgetName,
} from '../page-block/index.js';
import { PageBlockSchema } from '../page-block/page-model.js';
import { ParagraphBlockSchema } from '../paragraph-block/paragraph-model.js';
import { SurfaceBlockSchema } from '../surface-block/surface-model.js';

const pageBlockSpec: LitBlockSpec<DocPageBlockWidgetName> = {
  schema: PageBlockSchema,
  service: DefaultPageService,
  view: {
    component: literal`affine-default-page`,
    widgets: {
      slashMenu: literal`affine-slash-menu-widget`,
      linkedPage: literal`affine-linked-page-widget`,
      draggingArea: literal`affine-doc-dragging-area-widget`,
    },
  },
};

const edgelessBlockSpec: LitBlockSpec<EdgelessPageBlockWidgetName> = {
  schema: PageBlockSchema,
  service: EdgelessPageService,
  view: {
    component: literal`affine-edgeless-page`,
    widgets: {
      slashMenu: literal`affine-slash-menu-widget`,
      linkedPage: literal`affine-linked-page-widget`,
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
];
