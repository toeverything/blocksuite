import { AffineSchemas } from '@blocksuite/blocks';
import { Schema, DocCollection } from '@blocksuite/store';

export function getCurrentRoom() {
  const id = window.location.pathname.replace(/^\//, '');
  return id === '' ? undefined : id;
}

export function setRoom(id: string) {
  if (getCurrentRoom() === id) return;
  const newPath = `/${encodeURIComponent(id)}`;
  window.history.pushState({ path: newPath }, '', newPath);
}

export function initCollection(id = 'blocksuite-example') {
  const schema = new Schema().register(AffineSchemas);
  const collection = new DocCollection({ schema, id });

  return collection;
}

export function createDoc(collection: DocCollection) {
  const doc = collection.createDoc();

  doc.load(() => {
    const pageBlockId = doc.addBlock('affine:page', {});
    doc.addBlock('affine:surface', {}, pageBlockId);
    const noteId = doc.addBlock('affine:note', {}, pageBlockId);
    doc.addBlock('affine:paragraph', {}, noteId);
  });
  doc.resetHistory();
  return doc;
}
