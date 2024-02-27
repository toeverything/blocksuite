# `@blocksuite/store`

This package is the data layer for modeling collaborative document states. It's natively built on the CRDT library [Yjs](https://github.com/yjs/yjs), powering all BlockSuite documents with built-in real-time collaboration and time-travel capabilities.

## `Doc`

In BlockSuite, a [`Doc`](/api/@blocksuite/store/classes/Doc.html) is the container for a block tree, providing essential functionalities for creating, retrieving, updating, and deleting blocks inside it. Under the hood, every doc holds a Yjs [subdocument](https://docs.yjs.dev/api/subdocuments).

Besides the block tree, the [selection](./selection) state is also stored in the [`doc.awarenessStore`](/api/@blocksuite/store/classes/Doc.html#awarenessstore) inside the doc. This store is also built on top of the Yjs [awareness](https://docs.yjs.dev/api/about-awareness).

## `Workspace`

In BlockSuite, a [`Workspace`](/api/@blocksuite/store/classes/Workspace.html) is defined as an opt-in collection of multiple docs, providing comprehensive features for managing cross-doc updates and data synchronization. You can access the workspace via the `doc.workspace` getter, or you can also create a workspace manually:

```ts
import { Workspace, Schema } from '@blocksuite/store';

const schema = new Schema();

// You can register a batch of block schemas to the workspace
schema.register(AffineSchemas);

const workspace = new Workspace({ schema });
```

Then multiple `doc`s can be created under the workspace:

```ts
const workspace = new Workspace({ schema });

// This is an empty doc at this moment
const doc = workspace.createDoc();
```

As an example, the `createEmptyDoc` is a simple helper implemented exactly in this way ([source](https://github.com/toeverything/blocksuite/blob/master/packages/presets/src/helpers/index.ts)):

```ts
import { AffineSchemas } from '@blocksuite/blocks/models';
import { Schema, Workspace } from '@blocksuite/store';

export function createEmptyDoc() {
  const schema = new Schema().register(AffineSchemas);
  const workspace = new Workspace({ schema });
  const doc = workspace.createDoc();

  return {
    doc,
    async init() {
      await doc.load(() => {
        const rootBlockId = doc.addBlock('affine:page', {});
        doc.addBlock('affine:surface', {}, rootBlockId);
        const noteId = doc.addBlock('affine:note', {}, rootBlockId);
        doc.addBlock('affine:paragraph', {}, noteId);
      });
      return doc;
    },
  };
}
```
