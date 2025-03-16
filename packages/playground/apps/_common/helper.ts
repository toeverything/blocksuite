import { SpecProvider } from '@blocksuite/affine/shared/utils';
import { TestWorkspace } from '@blocksuite/affine/store/test';

export function createEmptyDoc() {
  const collection = new TestWorkspace();
  collection.storeExtensions = SpecProvider._.getSpec('store').value;
  collection.meta.initialize();
  const doc = collection.createDoc();

  return {
    doc,
    init() {
      doc.load();
      const rootId = doc.addBlock('affine:page', {});
      doc.addBlock('affine:surface', {}, rootId);
      const noteId = doc.addBlock('affine:note', {}, rootId);
      doc.addBlock('affine:paragraph', {}, noteId);
      return doc;
    },
  };
}
