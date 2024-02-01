# Quick Start

The `@blocksuite/presets` package contains the prebuilt editors and opt-in additional UI components. Its `canary` versions are released daily based on the master branch, which is also recommended for real world usage. You may also need to install `@blocksuite/store` explicitly for working with BlockSuite documents:

```sh
pnpm install \
  @blocksuite/presets@canary \
  @blocksuite/store@canary
```

Then you can use the prebuilt `DocEditor` out of the box, with an initialized `page` instance attached as its document model:

::: code-sandbox {coderHeight=420 previewHeight=300}

```ts /index.ts [active]
import '@blocksuite/presets/themes/affine.css';

import { createEmptyPage, DocEditor } from '@blocksuite/presets';
import { Text } from '@blocksuite/store';

(async () => {
  // Init editor with default block tree
  const page = await createEmptyPage().init();
  const editor = new DocEditor();
  editor.page = page;
  document.body.appendChild(editor);

  // Update block node with some initial text content
  const paragraphs = page.getBlockByFlavour('affine:paragraph');
  const paragraph = paragraphs[0];
  page.updateBlock(paragraph, { text: new Text('Hello World!') });
})();
```

:::

The `DocEditor` here is a standard web component that can also be reused with `<doc-editor>` HTML tag. Another `EdgelessEditor` also works similarly - simply attach the `editor` with a `page` and you are all set.

For the `page.getBlockByFlavour` and `page.updateBlock` APIs used here, please see the [introduction](./working-with-block-tree#block-tree-basics) about block tree basics for further details.
