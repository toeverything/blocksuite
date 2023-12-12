# Data Persistence in BlockSuite

BlockSuite offers flexible solutions for real-time and non-real-time applications. This guide explores optimal ways to utilize data persistence features in BlockSuite.

## Snapshot API

In scenarios where real-time collaboration is not a primary concern, such as in regular web apps or local apps requiring explicit save actions, BlockSuite has the JSON snapshot format as the best fit. The snapshot format is designed for readability, organizing blocks in an intuitive tree structure.

```ts
import { Job } from '@blocksuite/store';

// A job is required for performing the tasks
const job = new Job({ workspace });

// Export current page content to snapshot JSON
const json = await job.pageToSnapshot(page);

// Import snapshot JSON to a new page
const newPage = await job.snapshotToPage(json);
```

When it comes to integrating with third-party formats like markdown or HTML, the snapshot API should also be the go-to solution. It allows for adaptive transformations of the block tree (documentation WIP).

::: tip
In BlockSuite [playgroud](https://try-blocksuite.vercel.app/starter/?init), You can try the "Import/Export Snapshot" feature inside the "Test Operations" menu entry. You can also use the `job` variable in browser console for quick testing.
:::

## Realtime Provider-Based Persistence

When it comes to applications requiring real-time collaborative features, BlockSuite recommends the provider-based persistence approach. This approach could be summarized as **simply connecting the document to a provider, such as `WebSocket`, right from the initialization of the `workspace`**.

This ensures that **all updates within the editor's lifecycle are encoded as binary patches and distributed via the provider**. This is not only efficient but also ensures real-time, incremental synchronization of document states, offering peak performance for collaborative editors.

![pluggable-providers](./images/pluggable-providers.png)

BlockSuite supports a bunch of providers. It allows for the combination of different providers (as seen in [AFFiNE](https://github.com/toeverything/AFFiNE), which for example, uses both `SQLite` and `WebSocket` providers in the electron client) and supports dynamic disconnection and reconnection of providers. Thanks to the inherent properties of CRDTs, BlockSuite guarantees the **eventual consistency** of document states, regardless of the sequence in which patches from various providers are received.

```ts
// IndexedDB provider from yjs community
import { IndexeddbPersistence } from 'y-indexeddb';

// `page.spaceDoc` is the underlying CRDT data structure.
// Here we connect the doc to the IndexedDB table named 'my-doc'
const provider = new IndexeddbPersistence('my-doc', page.spaceDoc);
```

::: info
This approach is so fundamental to BlockSuite that early versions of BlockSuite even only supported provider-based persistence. In another word, BlockSuite doesn't have the `editor.load(json)` API alternatives in its early days! By using the CRDT binaries (instead of JSON snapshots) as the single source of truth in BlockSuite, the editor state is always collaboration-ready during its lifecycle.
:::

## Block Tree Initialization Basics

A critical aspect of using BlockSuite is the initialization of the block tree within a `page`. When working without a provider, it's recommended to directly use the snapshot API for importing existing documents:

```ts
const job = new Job({ workspace });

// Import snapshot JSON to a new page
const newPage = await job.snapshotToPage(json);
```

But alternatively, you can also use the `page.load(initCallbak)` API to imperatively construct the initial block tree. Since the "default empty state" of different BlockSuite editors may differ, it's up to application developers to decide the initial block structure:

```ts
page.load(() => {
  const rootId = page.addBlock('affine:page');
  page.addBlock('affine:surface', {}, rootId);
  page.addBlock('affine:note', {}, rootId);
});
```

::: tip
When we are talking about the "_default empty state_", it generally indicates the timing that user can see an empty page with placeholders, blinking cursor or toolbars that are ready for interactions, rather than a blank page.
:::

In contrast, when you are using BlockSuite with providers, the application logic must distinguish between creating a new document and loading an existing one.

- For _creating_ new documents, the process mirrors that of the non-provider scenario by simply using `page.load(initCallback)`.
- For _loading_ existing documents, the initial state should be awaited using `await page.load()`.

```ts
// If you are opening an existing page that is connected to the provider,
// the block tree should be ready right after this line.
await page.load();
```

In both cases, the `page.slots.ready` [slot](./event-api#using-slots) can be used to receive notifications upon the completion of block tree initialization.
