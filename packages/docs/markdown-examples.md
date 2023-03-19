# Basic Examples

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

<div id="editor-example" style="height: 300px; border: 1px solid black; padding: 0.75rem 0.5rem;"/>

<script setup>
import '@blocksuite/blocks';
import '@blocksuite/editor/themes/affine.css';
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

main();
</script>
