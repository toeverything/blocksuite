import type { LitBlockSpec } from '@blocksuite/lit';
import { literal } from 'lit/static-html.js';

import { BookmarkBlockSchema } from '../bookmark-block/index.js';
import { CodeBlockSchema } from '../code-block/code-model.js';
import { CodeBlockService } from '../code-block/code-service.js';
import { DatabaseBlockSchema } from '../database-block/database-model.js';
import { DividerBlockSchema } from '../divider-block/divider-model.js';
import { ImageBlockSchema } from '../image-block/image-model.js';
import { ListBlockService } from '../list-block/index.js';
import { ListBlockSchema } from '../list-block/list-model.js';
import { NoteBlockSchema } from '../note-block/note-model.js';
import { edgelessBlockSpec, pageBlockSpec } from '../page-block/index.js';
import { ParagraphBlockSchema } from '../paragraph-block/paragraph-model.js';
import { ParagraphBlockService } from '../paragraph-block/paragraph-service.js';
import { SurfaceBlockSchema } from '../surface-block/surface-model.js';

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
    service: ListBlockService,
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
    schema: DividerBlockSchema,
    view: {
      component: literal`affine-divider`,
    },
  },
  {
    schema: CodeBlockSchema,
    service: CodeBlockService,
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
    service: ParagraphBlockService,
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
    service: ListBlockService,
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
    schema: DividerBlockSchema,
    view: {
      component: literal`affine-divider`,
    },
  },
  {
    schema: CodeBlockSchema,
    service: CodeBlockService,
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
    service: ParagraphBlockService,
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
