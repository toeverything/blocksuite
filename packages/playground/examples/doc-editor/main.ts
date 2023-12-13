// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';

import { AffineSchemas } from '@blocksuite/blocks/models';
import { DocEditor } from '@blocksuite/presets';
import { Schema, Workspace } from '@blocksuite/store';

const schema = new Schema().register(AffineSchemas);
const workspace = new Workspace({ id: 'foo', schema });

const page = workspace.createPage();
await page.load(() => {
  const pageBlockId = page.addBlock('affine:page', {});
  page.addBlock('affine:surface', {}, pageBlockId);
  const noteId = page.addBlock('affine:note', {}, pageBlockId);
  page.addBlock('affine:paragraph', {}, noteId);
});

const editor = new DocEditor();
editor.page = page;
document.body.appendChild(editor);
