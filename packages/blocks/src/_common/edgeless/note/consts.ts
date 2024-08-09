import { NOTE_BACKGROUND_COLORS, NOTE_SHADOWS } from '@blocksuite/affine-model';

import { createZodUnion } from '../../utils/index.js';

export const NoteBackgroundColorsSchema = createZodUnion(
  NOTE_BACKGROUND_COLORS
);

export const NoteShadowsSchema = createZodUnion(NOTE_SHADOWS);

export const NOTE_SELECTOR =
  'affine-note, affine-edgeless-note .edgeless-note-page-content, affine-edgeless-text';
