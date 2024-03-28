import { AffineSchemas } from '@blocksuite/blocks/dist/schemas.js';
import { Schema, DocCollection } from '@blocksuite/store';
import * as api from './api.js';

export function getCurrentRoom() {
  const id = window.location.pathname.replace(/^\//, '');
  return id === '' ? undefined : id;
}

export function setRoom(id: string) {
  if (getCurrentRoom() === id) return;
  const newPath = `/${encodeURIComponent(id)}`;
  window.history.pushState({ path: newPath }, '', newPath);
}

export async function initCollection(id = 'blocksuite-example') {
  const schema = new Schema().register(AffineSchemas);
  const collection = new DocCollection({ schema, id });

  const docMetaInfos = await api.getDocMetas();

  docMetaInfos.map(docMeta => {
    collection.createDoc({ id: docMeta.id });
    collection.setDocMeta(docMeta.id, { ...docMeta });
  });

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

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
) {
  let timeoutId: NodeJS.Timeout;
  return (...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, limit);
  };
}
