import { AffineSchemas } from '@blocksuite/blocks/dist/schemas.js';
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

export function createCollection(id = 'blocksuite-example') {
  const schema = new Schema().register(AffineSchemas);
  return new DocCollection({ schema, id });
}

export function createDoc(collection: DocCollection, id: string) {
  const doc = collection.createDoc({ id });

  doc.load(() => {
    const pageBlockId = doc.addBlock('affine:page', {});
    doc.addBlock('affine:surface', {}, pageBlockId);
    const noteId = doc.addBlock('affine:note', {}, pageBlockId);
    doc.addBlock('affine:paragraph', {}, noteId);
  });
  doc.resetHistory();
  return doc;
}
