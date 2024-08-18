import type { BlockComponent, EditorHost } from '@blocksuite/block-std';
import type { BlockModel, Doc } from '@blocksuite/store';

import { type NoteBlockModel, NoteDisplayMode } from '@blocksuite/affine-model';

import { matchFlavours } from './checker.js';

export function findAncestorModel(
  model: BlockModel,
  match: (m: BlockModel) => boolean
) {
  let curModel: BlockModel | null = model;
  while (curModel) {
    if (match(curModel)) {
      return curModel;
    }
    curModel = curModel.parent;
  }
  return null;
}

/**
 * Get block component by its model and wait for the doc element to finish updating.
 *
 */
export async function asyncGetBlockComponent(
  editorHost: EditorHost,
  id: string
): Promise<BlockComponent | null> {
  const rootBlockId = editorHost.doc.root?.id;
  if (!rootBlockId) return null;
  const rootComponent = editorHost.view.getBlock(rootBlockId);
  if (!rootComponent) return null;
  await rootComponent.updateComplete;

  return editorHost.view.getBlock(id);
}

export function findNoteBlockModel(model: BlockModel) {
  return findAncestorModel(model, m =>
    matchFlavours(m, ['affine:note'])
  ) as NoteBlockModel | null;
}

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
