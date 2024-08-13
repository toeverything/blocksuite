import type { NoteBlockModel } from '@blocksuite/affine-model';
import type { BlockComponent, EditorHost } from '@blocksuite/block-std';
import type { BlockModel, Doc } from '@blocksuite/store';

import { minimatch } from 'minimatch';

export function matchFlavours<Key extends (keyof BlockSuite.BlockModels)[]>(
  model: BlockModel | null,
  expected: Key
): model is BlockSuite.BlockModels[Key[number]] {
  return (
    !!model &&
    expected.some(key =>
      minimatch(model.flavour as keyof BlockSuite.BlockModels, key)
    )
  );
}

export function isInsideBlockByFlavour(
  doc: Doc,
  block: BlockModel | string,
  flavour: string
): boolean {
  const parent = doc.getParent(block);
  if (parent === null) {
    return false;
  }
  if (flavour === parent.flavour) {
    return true;
  }
  return isInsideBlockByFlavour(doc, parent, flavour);
}

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
