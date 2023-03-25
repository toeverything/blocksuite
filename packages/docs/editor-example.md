<div id="editor-example" style="height: 250px; border: 1px solid grey; padding: 20px;"></div>

<script>
import '@blocksuite/editor/themes/affine.css';

async function main() {
  const { Workspace, Page, Text } = await import('@blocksuite/store');
  const { AffineSchemas } = await import('@blocksuite/blocks/models');
  const { EditorContainer } = await import('@blocksuite/editor');

  // Create a workspace with one default page
  const workspace = new Workspace({ id: 'test' }).register(AffineSchemas);
  const page = workspace.createPage('page0');

  // Create default blocks in the page
  const pageBlockId = page.addBlock('affine:page', {
    title: new Text('Hello BlockSuite!'),
  });
  const frameId = page.addBlock('affine:frame', {}, pageBlockId);
  page.addBlock('affine:paragraph', {
    text: new Text('Start editing here!'),
  }, frameId);

  // Init editor with the page store
  const editor = new EditorContainer();
  editor.page = page;
  const node = document.querySelector('#editor-example');
  node.innerHTML = '';

  node.appendChild(editor);
}

if (typeof window !== 'undefined') {
  main();
}
</script>

```ts
import '@blocksuite/editor/themes/affine.css';

async function main() {
  const { Workspace, Page, Text } = await import('@blocksuite/store');
  const { AffineSchemas } = await import('@blocksuite/blocks/models');
  const { EditorContainer } = await import('@blocksuite/editor');

  // Create a workspace with one default page
  const workspace = new Workspace({ id: 'test' }).register(AffineSchemas);
  const page = workspace.createPage('page0');

  // Create default blocks in the page
  const pageBlockId = page.addBlock('affine:page', {
    title: new Text('Hello BlockSuite!'),
  });
  const frameId = page.addBlock('affine:frame', {}, pageBlockId);
  page.addBlock(
    'affine:paragraph',
    {
      text: new Text('Start editing here!'),
    },
    frameId
  );

  // Init editor with the page store
  const editor = new EditorContainer();
  editor.page = page;
  document.querySelector('#editor-example').appendChild(editor);
}

main();
```
