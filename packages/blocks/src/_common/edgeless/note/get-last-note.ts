import type { Doc } from '@blocksuite/store';

import { type NoteBlockModel, NoteDisplayMode } from '@blocksuite/affine-model';
import { matchFlavours } from '@blocksuite/affine-shared/utils';

export function getLastNoteBlock(doc: Doc) {
  let note: NoteBlockModel | null = null;
  if (!doc.root) return null;
  const { children } = doc.root;
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    if (
      matchFlavours(child, ['affine:note']) &&
      child.displayMode !== NoteDisplayMode.EdgelessOnly
    ) {
      note = child as NoteBlockModel;
      break;
    }
  }
  return note;
}
