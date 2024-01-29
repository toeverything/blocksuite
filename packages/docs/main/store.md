# `@blocksuite/store`

This package is the data layer for modeling collaborative document states. It's natively built on the CRDT library [Yjs](https://github.com/yjs/yjs), powering all BlockSuite documents with built-in real-time collaboration and time-travel capabilities.

## `Page`

In BlockSuite, a [`Page`](/api/@blocksuite/store/classes/Page.html) is the container for a block tree, providing essential functionalities for creating, retrieving, updating, and deleting blocks inside it. Under the hood, every page holds a Yjs [subdocument](https://docs.yjs.dev/api/subdocuments).

Besides the block tree, the [selection](./selection) state is also stored in the [`page.awarenessStore`](/api/@blocksuite/store/classes/Page.html#awarenessstore) inside the page. This store is also built on top of the Yjs [awareness](https://docs.yjs.dev/api/about-awareness).

## `Workspace`

In BlockSuite, a [`Workspace`](/api/@blocksuite/store/classes/Workspace.html) is defined as an opt-in collection of multiple pages, providing comprehensive features for managing cross-page updates and data synchronization. You can access the workspace via the `page.workspace` getter, or you can also create a workspace manually:

```ts
import { Workspace, Schema } from '@blocksuite/store';

const schema = new Schema();

// You can register a batch of block schemas to the workspace
schema.register(AffineSchemas);

const workspace = new Workspace({ schema });
```

Then multiple `page`s can be created under the workspace:

```ts
const workspace = new Workspace({ schema });

// This is an empty page at this moment
const page = workspace.createPage();
```

As an example, the `createEmptyPage` is a simple helper implemented exactly in this way ([source](https://github.com/toeverything/blocksuite/blob/master/packages/presets/src/helpers/index.ts)):

```ts
import { AffineSchemas } from '@blocksuite/blocks/models';
import { Schema, Workspace } from '@blocksuite/store';

export function createEmptyPage() {
  const schema = new Schema().register(AffineSchemas);
  const workspace = new Workspace({ schema });
  const page = workspace.createPage();

  return {
    page,
    async init() {
      await page.load(() => {
        const pageBlockId = page.addBlock('affine:page', {});
        page.addBlock('affine:surface', {}, pageBlockId);
        const noteId = page.addBlock('affine:note', {}, pageBlockId);
        page.addBlock('affine:paragraph', {}, noteId);
      });
      return page;
    },
  };
}
```
