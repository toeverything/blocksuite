import type { DocCollection } from '@blocksuite/store';

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
