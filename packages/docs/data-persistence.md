# Data Persistence

In the `SimpleAffineEditor` example, we did not actually use the data persistence capability of BlockSuite. This means that the blocks created by the user will disappear after the page is refreshed. How can we store these contents to a server or local database?

BlockSuite uses CRDT data model that is very similar to Git. This means that when you call methods like `page.addBlock`, this is equivalent to synchronously committing to Git (all block operation APIs in BlockSuite are synchronous, which brings a very convenient and reliable development experience). And thanks to the capability of CRDT, it can efficiently serialize the entire block state sequence into binary.

::: tip
The BlockSuite workspace is encoded using the [y-protocols](https://github.com/yjs/y-protocols) protocol, which can be thought of as a binary JSON format for collaborative applications. You can enter `Y.encodeStateAsUpdate(workspace.doc)` in the console of the [BlockSuite Playground](https://blocksuite-toeverything.vercel.app/?init) to view the encoded workspace.
:::

However, the more powerful aspect of the Git model is that you only need to connect via SSH or HTTP to sync a Git repository, without worrying about handling asynchronous network IO details. This is why BlockSuite provides a provider-based persistence solution.

## Provider-Based Persistence

Different providers can handle the asynchronous IO over different network protocols (such as WebSocket and WebRTC) and storages (such as IndexedDB and SQLite). As long as the BlockSuite workspace is connected to the provider, you can reliably synchronize blocks through it.

![pluggable-providers](./images/pluggable-providers.png)

Code example:

```ts
import { Workspace } from '@blocksuite/store';
import { AffineSchemas } from '@blocksuite/blocks/models';
import { IndexeddbPersistence } from 'y-indexeddb';

const workspace = new Workspace();
workspace.register(AffineSchemas);

// `workspace.doc` is the underlying Yjs data structure
const { doc } = workspace;
// Connect the doc to the IndexedDB table named `foo`
const provider = new IndexeddbPersistence('foo', doc);

provider.on('synced', () => {
  console.log('content from the database is loaded');
});
```

The content in this workspace will be automatically synchronized to an IndexedDB table named `foo`. Now you can add a button to the page and execute the following code when it is clicked:

```ts
const page = workspace.createPage();
page.addBlock('affine:page', { title: new Text('hello') });
```

The document data will be automatically synchronized to IndexedDB. After the next refresh, the content of `affine:page` should appear directly on the page. If you want to use a WebSocket connection, you can achieve the same persistence effect with very similar code logic by switching or using providers simultaneously. As BlockSuite leverages Yjs as its underlying data structure, you can reuse the [connection providers](https://docs.yjs.dev/ecosystem/connection-provider) or the [database providers](https://docs.yjs.dev/ecosystem/database-provider) from the Yjs ecosystem.

::: tip

- The BlockSuite workspace is **always empty when created**, and the source of block update is either by calling the API to create blocks or by receiving updates from the provider.
- Multiple providers can be reliably connected at the same time, just as it is easy to add multiple remote upstreams for a git repository.
  :::

You can view more provider usage instructions in the [BlockSuite Playground](https://blocksuite-toeverything.vercel.app/?init).

## Reusing Binary Data

The `workspace.doc` in BlockSuite is encoded in binary format before being stored in the provider backend. This binary data structure can also be deserialized to reconstruct the document state. This process can also be easily accomplished through standardized APIs.

If you want to explicitly obtain the binary content of a document in certain scenarios (e.g., storing the content on the server-side), you can do it like this:

```ts
import * as Y from 'yjs';

// Get the encoded binary
const binary = Y.encodeStateAsUpdate(workspace.doc);
```

The obtained `Uint8Array` can then be stored and distributed independently. On the other hand, the stored binary update data only needs to be applied to an empty workspace to restore it to a usable block tree, like this:

```ts
const workspace = new Workspace({ id: 'foo' });

const binary = await loadBinary();

Y.applyUpdate(workspace.doc, binary);
```

## Common Patterns

If you want to use BlockSuite in a common centralized application and support real-time collaboration, the recommended approach is as follows:

1. When a user starts creating content from scratch, create an empty `workspace` and `page`. As long as `workspace.doc` is connected to the provider, the created initial content will be automatically recorded.
2. As the user continues to write new content, the state can be continuously synchronized to the server-side through the provider, or the binary can be backed up to the database periodically.
3. When the user reopens an existing document, just connect to the provider to automatically restore the block tree from the binary update data. If continuous synchronization is not required, you can also deserialize the binary data into a block tree by calling `Y.applyUpdate` once.

It is worth noting that if you want to load existing content in a page, you should not explicitly create a new `page` through `workspace.createPage`. Instead, you should automatically load the existing block tree by connecting to the provider or calling `Y.applyUpdate`. Otherwise, this would be equivalent to performing `git commit` in an empty git repository and then `git pull` from an existing upstream, which may cause state merge issues.
