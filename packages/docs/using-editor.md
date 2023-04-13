# Using Editor

TODO

<script>
import '@blocksuite/editor/themes/affine.css';

async function main() {
  const { Workspace, Page, Text } = await import('@blocksuite/store');
  const { AffineSchemas } = await import('@blocksuite/blocks/models');
  const { EditorContainer } = await import('@blocksuite/editor');

  // Create a workspace with one default page
  const workspace = new Workspace({ id: 'test' }).register(AffineSchemas);
  const page = workspace.createPage('page0');

  const title = new Text('Hello BlockSuite!');
  const defaultContent = new Text('Start editing here!');

  // Create default blocks in the page
  const pageBlockId = page.addBlock('affine:page', { title });

  // Add the frame to the page
  const frameId = page.addBlock('affine:frame', {}, pageBlockId);

  // Add the paragraph to the frame
  page.addBlock('affine:paragraph', { text: defaultContent }, frameId);

  // Init editor with the page store
  const editor = new EditorContainer();
  editor.page = page;
  document.querySelector('#editor-example').appendChild(editor);
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

  const title = new Text('Hello BlockSuite!');
  const defaultContent = new Text('Start editing here!');

  // Create default blocks in the page
  const pageBlockId = page.addBlock('affine:page', { title });

  // Add the frame to the page
  const frameId = page.addBlock('affine:frame', {}, pageBlockId);

  // Add the paragraph to the frame
  page.addBlock('affine:paragraph', { text: defaultContent }, frameId);

  // Init editor with the page store
  const editor = new EditorContainer();
  editor.page = page;
  document.querySelector('#editor-example').appendChild(editor);
}

main();
```

<div id="editor-example" style="height: 250px; border: 1px solid grey; padding: 20px;"></div>
