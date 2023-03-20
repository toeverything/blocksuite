<div id="editor-example" style="height: 300px; border: 1px solid black;"/>

<script>
import '@blocksuite/editor/themes/affine.css';
async function main() {
  await import('@blocksuite/blocks');
  await import('@blocksuite/store');
  const { Workspace, Page } = await import('@blocksuite/store');
  const { AffineSchemas } = await import('@blocksuite/blocks/models');
  const { EditorContainer } = await import('@blocksuite/editor');

  // Create a workspace with one default page
  const workspace = new Workspace({ id: 'test' }).register(AffineSchemas);
  const page = workspace.createPage('page0');

  // Create default blocks in the page
  const pageBlockId = page.addBlock('affine:page', {
    title: new page.Text('Hello BlockSuite!'),
  });
  const frameId = page.addBlock('affine:frame', {}, pageBlockId);
  page.addBlock('affine:paragraph', {
    text: new page.Text('Start editing me!'),
  }, frameId);

  // Init editor with the page store
  const editor = new EditorContainer();
  editor.page = page;
  setTimeout(() => {
    document.querySelector('#editor-example').appendChild(editor);
  }, 0);
}

if (typeof window !== 'undefined') {
  main();
}
</script>

```tsx
import '@blocksuite/blocks';
import { Workspace, Page } from '@blocksuite/store';
import { AffineSchemas } from '@blocksuite/blocks/models';
import { EditorContainer } from '@blocksuite/editor';

function main() {
  // Create a workspace with one default page
  const workspace = new Workspace({ id: 'test' }).register(AffineSchemas);
  const page = workspace.createPage('page0');

  // Create default blocks in the page
  const pageBlockId = page.addBlock('affine:page', {
    title: new page.Text('Hello BlockSuite!'),
  });
  const frameId = page.addBlock('affine:frame', {}, pageBlockId);
  page.addBlock(
    'affine:paragraph',
    {
      text: new page.Text('Start editing me!'),
    },
    frameId
  );

  // Init editor with the page store
  const editor = new EditorContainer();
  editor.page = page;
  document.body.appendChild(editor);
}

main();
```
