import type { Page } from '@blocksuite/store';

import { getBlockElementByModel } from '../index.js';
import type { NoteBlockModel, SurfaceBlockModel } from '../models.js';
import { DEFAULT_NOTE_HEIGHT } from '../page-block/edgeless/utils/consts.js';

export function getSurfaceBlock(page: Page) {
  return (
    (page.getBlockByFlavour('affine:surface')[0] as SurfaceBlockModel) ?? null
  );
}

export function getHeightOfNoteChildern(
  noteModel: NoteBlockModel,
  start: number = 0,
  end: number = noteModel.children.length - 1
) {
  const first = getBlockElementByModel(
    noteModel.children[start]
  )?.getBoundingClientRect();
  const last = getBlockElementByModel(
    noteModel.children[end]
  )?.getBoundingClientRect();

  if (!first || !last) {
    return DEFAULT_NOTE_HEIGHT;
  }

  return last.bottom - first.top;
}
