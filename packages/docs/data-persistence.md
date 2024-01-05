# Data Persistence

No matter the application is collaborative of not, BlockSuite offers flexible solutions for data persistence. This guide explores optimal ways to save and load documents in BlockSuite.

## Snapshot API

When real-time collaboration is not a primary concern, such as in regular web apps or local apps, BlockSuite has the JSON snapshot format as the best fit. The snapshot format is designed for readability, organizing blocks in an intuitive tree structure.

```ts
import { Job } from '@blocksuite/store';

const { workspace } = page;

// A job is required for performing the tasks
const job = new Job({ workspace });

// Export current page content to snapshot JSON
const json = await job.pageToSnapshot(page);

// Import snapshot JSON to a new page
const newPage = await job.snapshotToPage(json);
```

When it comes to integrating with third-party formats like markdown or HTML, the [`Adapter`](./adapter) API based on snapshot is also reusable. It allows for adaptive transformations of the block tree.

::: tip
In BlockSuite [playgroud](https://try-blocksuite.vercel.app/starter/?init), You can try the "Import/Export Snapshot" feature inside the "Test Operations" menu entry. You can also use the `job` variable in browser console for quick testing.
:::

## Provider-Based Persistence

When it comes to applications requiring real-time collaborative features, BlockSuite recommends the provider-based persistence approach. This approach could be summarized as **simply connecting the document to providers, (.e.g, `WebSocketProvider`), right from the initialization of the documents**.

This ensures that **all updates within the editor's lifecycle are encoded as binary patches and distributed via the provider**. This is not only efficient but also ensures real-time, incremental synchronization of document states, offering best performance for collaborative editors.

![pluggable-providers](./images/pluggable-providers.png)

BlockSuite supports a bunch of providers. It allows for the combination of different providers (as seen in [AFFiNE](https://github.com/toeverything/AFFiNE), which for example, uses both `SQLite` and `WebSocket` providers in the electron client) and supports dynamic disconnection and reconnection of providers. Thanks to the inherent properties of CRDTs, BlockSuite guarantees the **eventual consistency** of document states, regardless of the sequence in which patches from various providers are received.

```ts
// IndexedDB provider from yjs community
import { IndexeddbPersistence } from 'y-indexeddb';

// `page.spaceDoc` is the underlying CRDT data structure.
// Here we connect the doc to the IndexedDB table named 'my-doc'
const provider = new IndexeddbPersistence('my-doc', page.spaceDoc);
```

Provider-based persistence is so fundamental that it was the only way loading documents for early BlockSuite versions! In another word, **as a document-centric framework, BlockSuite (proudly) doesn't support `editor.load(json)` API natively**. By using the CRDT document as the single source of truth, the BlockSuite editor state is always collaboration-ready during its lifecycle.

::: info
Being document-centric means that **documents** generally live longer than **editors**, which is exactly what provider allows.
:::

## Block Tree Initialization Basics

By default, a newly created `page` has no blocks inside. Here we clarify different ways to initialize the block tree for a `page`.

### Creating Page from Snapshot

When working without a provider, it's recommended to directly use the snapshot API for importing existing documents:

```ts
const job = new Job({ workspace });

// Import snapshot JSON to a new page
const newPage = await job.snapshotToPage(json);
```

### Creating New Block Tree

You can also use the `page.load(initCallbak)` API to programmatically construct the initial block tree. Since the "default empty state" of different BlockSuite editors may differ, it's up to editors to decide the initial block structure. This example creates a block tree for `DocEditor`:

```ts
page.load(() => {
  const rootId = page.addBlock('affine:page');
  page.addBlock('affine:surface', {}, rootId);
  page.addBlock('affine:note', {}, rootId);
});
```

This is exactly how the `createEmptyPage().init()` helper works under the hood ([source](https://github.com/toeverything/blocksuite/blob/master/packages/presets/src/helpers/index.ts)):

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

### Loading from Provider

When you are using BlockSuite with providers, the application logic should distinguish between **creating** a new document and **loading** an existing one.

Here is the rule of thumb for loading documents in a provider-based application:

- For creating new documents, simply use `page.load(initCallback)`.
- For loading existing documents, wait by `await page.load()` after the page is connected to providers.

```ts
// If you are opening an existing page that is connected to the provider,
// the block tree should be ready right after this line.
await page.load();
```

In both cases, after the block tree is **loaded** or **created**, the [`page.slots.ready`](/api/@blocksuite/store/classes/Page.html#ready-1) slot will be triggered, indicating the completion of block tree initialization.
