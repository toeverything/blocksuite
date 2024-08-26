import type { BlockSpec } from '@blocksuite/block-std';

import { NoteBlockSchema } from '@blocksuite/affine-model';
import { literal } from 'lit/static-html.js';

import { commands } from './commands/index.js';
import { NoteBlockService } from './note-service.js';

export const NoteBlockSpec: BlockSpec = {
  schema: NoteBlockSchema,
  service: NoteBlockService,
  view: {
    component: literal`affine-note`,
  },
  commands,
};

export const EdgelessNoteBlockSpec: BlockSpec = {
  schema: NoteBlockSchema,
  service: NoteBlockService,
  view: {
    component: literal`affine-edgeless-note`,
  },
  commands,
};
