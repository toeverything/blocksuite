我是 blocksuite 这个开源协作编辑项目的维护者。现在我希望对一篇名为 data persistence 的文档进行重写，因为其中很多内容已不准确，或者已经不再是重点。请根据如下要点，用相同的行文风格帮我用英语重写一份新的文档：

- BlockSuite 支持多种数据存取方式，视是否需要实时协作有不同的最佳实践：
  - 如果对实时性要求不高，例如对于需要显式执行保存操作的常规 cloud 应用或纯本地应用，建议将单篇 page 全量导入导出到 snapshot JSON 格式。
    - Snapshot 格式具有很好的可读性，page 中的 block 会被表达成树形结构，还带有如 block 版本这样的 meta 信息以应对 breaking change，使用很简单。
    - 如果想导入和导出 markdown 和 HTML 等第三方格式，也应该通过 snapshot API 来进行对 block tree 的变换。这部分内容会在后续文档中介绍。
    - 注意不要误用 `workspace.doc.toJSON()`，这个 API 是对运行时 CRDT 数据的直接序列化，返回的内容不是树型结构，也不能重新导入回编辑器中，只能用于调试。
    - 这一节需要展示通过 API 读写 snapshot 的一份代码块简单示例。
  - 如果是多人实时协作，应该使用 provider-based persistence 方案。
    - 这个方案是从 workspace 实例化开始时，就将文档连接到如 WebSocket 这样的 provider 的管道上。这样从文档初始状态开始，编辑器生命周期内的所有更新都会编码为二进制的 patch，经由 provider 分发。这可以完全增量地同步状态，具备最优的性能。
    - Provider 可以同时连接多个（如在 AFFiNE 中就会同时使用 SQLite 和 WebSocket 的 provider），也可以中途断联。CRDT 的性质能保证不论以什么顺序接收到来自不同 provider 的 patch，都能还原最终一致的文档状态。在 BlockSuite 中，这里的 patch 是通过 y-protocol 协议编码，相当于面向 CRDT 的 protobuf。
    - 这种架构允许每个客户端各自初始化文档并互相同步，能够支持去中心化的实时协作。换言之，任意一份文档都可以完全在本地创建，同步到服务端时就像将一个 git 仓库通过 HTTPS 或 SSH 等不同协议推送到 git 一样。这样既能将应用数据流完全本地化又能无缝地实时协作，而这就是 local-first 的核心理念。
    - 基于 BlockSuite 的 AFFiNE 知识库就使用了此 provider 方案，会始终将文档以 CRDT binary 形式存储，但也允许导出 snapshot 供用户备份数据。
    - 这一节需要展示插拔 provider 和 sqlite 的一份代码块简单示例。
  - 不论有无 provider，如何初始化 page 中的 block tree 都非常重要。BlockSuite 的 API 设计保证了它在这两种情况下都能可靠地工作。
    - 无 provider 时，如果不通过 snapshot API 导入文档，就应该通过 page.load(() => { page.addBlock(); page.addBlock(); /_ ...... _/ }) 这样的 API，在 page.load 的回调中完成一篇文档中初始内容的建立。
    - 有 provider 时，应用层逻辑中应当区分是创建一份新文档还是加载一份已有文档。
      - 创建新文档时，应该也是使用上面的 page.load(initCallback) 形式。
      - 加载已有文档时，应该 await page.load() 来等待初始状态从 provider 中获得。
    - 不论有没有 provider，都可以通过 page.slots.ready 来在文档完成初始化时获得相应提示。
    - 实际上，早期版本的 BlockSuite API 甚至仅支持基于 provider 的数据持久化，是一个完全面向 local-first 架构而设计的框架。
    - 这一节需要展示 load page 的一份代码块简单示例。

---

# Data Persistence

BlockSuite uses CRDT data model that is very similar to Git. This means that when you call methods like `page.addBlock`, this is equivalent to synchronously committing to Git (all block operation APIs in BlockSuite are synchronous, which brings a very convenient and reliable development experience). And thanks to the capability of CRDT, it can efficiently serialize the entire block state sequence into binary.

::: tip
The BlockSuite workspace is encoded using the [y-protocols](https://github.com/yjs/y-protocols) protocol, which can be thought of as a binary JSON format for collaborative applications. You can enter `Y.encodeStateAsUpdate(workspace.doc)` in the console of the [BlockSuite Playground](https://blocksuite-toeverything.vercel.app/starter/?init) to view the encoded workspace.
:::

However, the more powerful aspect of the Git model is that you only need to connect via SSH or HTTP to sync a Git repository, without worrying about handling asynchronous network IO details. This is why BlockSuite provides a provider-based persistence solution.

## Provider-Based Persistence

Different providers can handle the asynchronous IO over different network protocols (such as WebSocket and BroadcastChannel) and storages (such as IndexedDB and SQLite). As long as the BlockSuite workspace is connected to the provider, you can reliably synchronize blocks through it.

![pluggable-providers](./images/pluggable-providers.png)

Code example:

```ts
import { Workspace, Schema } from '@blocksuite/store';
import { AffineSchemas } from '@blocksuite/blocks/models';
import { IndexeddbPersistence } from 'y-indexeddb';

const schema = new Schema();
schema.register(AffineSchemas);

const workspace = new Workspace({ schema });

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

You can view more provider usage instructions in the [BlockSuite Playground](https://blocksuite-toeverything.vercel.app/starter/?init).

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
