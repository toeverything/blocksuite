import type { BlockSpec } from '@blocksuite/block-std';

import { literal } from 'lit/static-html.js';

import { NoteBlockSchema } from './note-model.js';
import { NoteBlockService } from './note-service.js';

export const NoteBlockSpec: BlockSpec = {
  schema: NoteBlockSchema,
  service: NoteBlockService,
  view: {
    component: literal`affine-note`,
  },
};

export const EdgelessNoteBlockSpec: BlockSpec = {
  schema: NoteBlockSchema,
  service: NoteBlockService,
  view: {
    component: literal`affine-edgeless-note`,
  },
};
