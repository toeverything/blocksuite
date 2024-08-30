import { NoteBlockSchema } from '@blocksuite/affine-model';
import { type BlockSpec, FlavourExtension } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { commands } from './commands/index.js';
import { NoteBlockService } from './note-service.js';

export const NoteBlockSpec: BlockSpec = {
  schema: NoteBlockSchema,
  view: {
    component: literal`affine-note`,
  },
  commands,
  extensions: [FlavourExtension('affine:note'), NoteBlockService],
};

export const EdgelessNoteBlockSpec: BlockSpec = {
  schema: NoteBlockSchema,
  view: {
    component: literal`affine-edgeless-note`,
  },
  commands,
  extensions: [FlavourExtension('affine:note'), NoteBlockService],
};
