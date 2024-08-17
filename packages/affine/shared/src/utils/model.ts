import type { NoteBlockModel } from '@blocksuite/affine-model';
import type { BlockComponent, EditorHost } from '@blocksuite/block-std';
import type { BlockModel, Doc, DocCollection } from '@blocksuite/store';

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

export function createDefaultDoc(
  collection: DocCollection,
  options: { id?: string; title?: string } = {}
) {
  const doc = collection.createDoc({ id: options.id });

  doc.load();
  const title = options.title ?? '';
  const rootId = doc.addBlock('affine:page', {
    title: new doc.Text(title),
  });
  collection.setDocMeta(doc.id, {
    title,
  });

  // @ts-ignore FIXME: will be fixed when surface model migrated to affine-model
  doc.addBlock('affine:surface', {}, rootId);
  const noteId = doc.addBlock('affine:note', {}, rootId);
  doc.addBlock('affine:paragraph', {}, noteId);
  // To make sure the content of new doc would not be clear
  // By undo operation for the first time
  doc.resetHistory();

  return doc;
}
