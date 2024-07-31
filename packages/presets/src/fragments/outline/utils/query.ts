import type { EditorHost } from '@blocksuite/block-std';
import type {
  NoteDisplayMode,
  ParagraphBlockModel,
  RootBlockModel,
} from '@blocksuite/blocks';
import type { BlockModel, Doc } from '@blocksuite/store';

import { BlocksUtils, type NoteBlockModel } from '@blocksuite/blocks';
import { clamp } from '@blocksuite/global/utils';

import { headingKeys } from '../config.js';

type OutlineNoteItem = {
  note: NoteBlockModel;
  /**
   * the index of the note inside its parent's children property
   */
  index: number;
  /**
   * the number displayed on the outline panel
   */
  number: number;
};

export function getNotesFromDoc(
  doc: Doc,
  modes: NoteDisplayMode[]
): OutlineNoteItem[] {
  const rootModel = doc.root;
  if (!rootModel) return [];

  const notes: OutlineNoteItem[] = [];

  rootModel.children.forEach((block, index) => {
    if (!['affine:note'].includes(block.flavour)) return;

    const blockModel = block as NoteBlockModel;
    const OutlineNoteItem = {
      note: block as NoteBlockModel,
      index,
      number: index + 1,
    };

    if (modes.includes(blockModel.displayMode)) {
      notes.push(OutlineNoteItem);
    }
  });

  return notes;
}

export function isRootBlock(block: BlockModel): block is RootBlockModel {
  return BlocksUtils.matchFlavours(block, ['affine:page']);
}

export function isHeadingBlock(
  block: BlockModel
): block is ParagraphBlockModel {
  return (
    BlocksUtils.matchFlavours(block, ['affine:paragraph']) &&
    headingKeys.has(block.type$.value)
  );
}

export function getHeadingBlocksFromNote(
  note: NoteBlockModel,
  ignoreEmpty = false
) {
  const models = note.children.filter(block => {
    const empty = block.text && block.text.length > 0;
    return isHeadingBlock(block) && (!ignoreEmpty || empty);
  });

  return models;
}

export function getHeadingBlocksFromDoc(
  doc: Doc,
  modes: NoteDisplayMode[],
  ignoreEmpty = false
) {
  const notes = getNotesFromDoc(doc, modes);
  return notes
    .map(({ note }) => getHeadingBlocksFromNote(note, ignoreEmpty))
    .flat();
}

export function isHeadingBeforeViewportCenter(
  heading: BlockModel,
  editorHost: EditorHost
) {
  if (!isHeadingBlock(heading)) return false;

  const headingElement = editorHost.view.getBlock(heading.id);
  if (!headingElement) return false;

  const editorRect = (
    editorHost.parentElement ?? editorHost
  ).getBoundingClientRect();
  const headingRect = headingElement.getBoundingClientRect();

  const editorCenter =
    clamp(editorRect.top, 0, document.documentElement.clientHeight) +
    Math.min(editorRect.height, document.documentElement.clientHeight) / 2;

  const headingCenter = headingRect.top + headingRect.height / 2;

  return headingCenter < editorCenter;
}
