# Quick Start

The `@blocksuite/presets` package contains the prebuilt editors and opt-in additional UI components. Its `canary` versions are released daily based on the master branch, which is also used in production in [AFFiNE](https://github.com/toeverything/AFFiNE). To work with the BlockSuite document model, You may also need to install `@blocksuite/store` explicitly:

```sh
pnpm install \
  @blocksuite/presets@canary \
  @blocksuite/store@canary
```

Then you can use the prebuilt `PageEditor` out of the box, with an initialized `doc` instance attached as its document model:

::: code-sandbox {coderHeight=420 previewHeight=300}

```ts /index.ts [active]
import '@blocksuite/presets/themes/affine.css';

import { createEmptyDoc, PageEditor } from '@blocksuite/presets';
import { Text } from '@blocksuite/store';

(async () => {
  // Init editor with default block tree
  const doc = createEmptyDoc().init();
  const editor = new PageEditor();
  editor.doc = doc;
  document.body.appendChild(editor);

  // Update block node with some initial text content
  const paragraphs = doc.getBlockByFlavour('affine:paragraph');
  const paragraph = paragraphs[0];
  doc.updateBlock(paragraph, { text: new Text('Hello World!') });
})();
```

:::

The `PageEditor` here is a standard web component that can also be reused with `<page-editor>` HTML tag. Another `EdgelessEditor` also works similarly - simply attach the `editor` with a `doc` and you are all set.

For the `doc.getBlockByFlavour` and `doc.updateBlock` APIs used here, please see the [introduction](./working-with-block-tree#block-tree-basics) about block tree basics for further details.

As the next step, you can choose to:

- Explore how BlockSuite break down editors into different [component types](./component-types). Taking a look at the list of [BlockSuite components](../components/overview) may also be helpful.
- Try collaborative editing [following the steps](https://github.com/toeverything/blocksuite/blob/master/BUILDING.md#test-collaboration).
- Learn about [basic concepts](./working-with-block-tree) in BlockSuite framework that are used throughout the development of editors.
- Run [examples](https://github.com/toeverything/blocksuite/tree/master/examples) integrating BlockSuite into common environments and UI frameworks.

Note that BlockSuite is still under rapid development. For any questions or feedback, feel free to let us know!
