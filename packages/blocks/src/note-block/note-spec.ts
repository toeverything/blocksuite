import {
  BlockViewExtension,
  CommandExtension,
  type ExtensionType,
  FlavourExtension,
} from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

import { commands } from './commands/index.js';
import { NoteBlockService, NoteDragHandleOption } from './note-service.js';

export const NoteBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:note'),
  NoteBlockService,
  CommandExtension(commands),
  BlockViewExtension('affine:note', literal`affine-note`),
];

export const EdgelessNoteBlockSpec: ExtensionType[] = [
  FlavourExtension('affine:note'),
  NoteBlockService,
  CommandExtension(commands),
  BlockViewExtension('affine:note', literal`affine-edgeless-note`),
  NoteDragHandleOption,
];
