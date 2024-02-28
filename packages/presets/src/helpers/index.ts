import { AffineSchemas } from '@blocksuite/blocks/models';
import { Schema, Workspace } from '@blocksuite/store';

export function createEmptyDoc() {
  const schema = new Schema().register(AffineSchemas);
  const workspace = new Workspace({ schema });
  const doc = workspace.createDoc();

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
