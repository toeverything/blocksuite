import { AffineSchemas } from '@blocksuite/blocks/models';
import { Schema, Workspace } from '@blocksuite/store';

export function createEmptyPage() {
  const schema = new Schema().register(AffineSchemas);
  const workspace = new Workspace({ schema });
  const page = workspace.createPage();

  return {
    page,
    async init() {
      page.load();
      const pageBlockId = page.addBlock('affine:page', {});
      page.addBlock('affine:surface', {}, pageBlockId);
      const noteId = page.addBlock('affine:note', {}, pageBlockId);
      page.addBlock('affine:paragraph', {}, noteId);
      return page;
    },
  };
}
