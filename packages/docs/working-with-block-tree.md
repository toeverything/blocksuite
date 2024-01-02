# Working with Block Tree

In previous examples, we demonstrated how a `page` collaborates with an `editor`. In this document, we will introduce the basic structure of the block tree within the `page` and the common methods for controlling it in an editor environment.

## Block Tree Basics

In BlockSuite, each `page` object manages an independent block tree composed of various types of blocks. These blocks can be defined through the [`BlockSchema`](./block-schema.md), which specifies their fields and permissible nesting relationships among different block types. Each block type has a unique `block.flavour`, following a `namespace:name` naming structure. Since the preset editors in BlockSuite are derived from the [AFFiNE](https://github.com/toeverything/AFFiNE) project, the default editable blocks use the `affine` prefix.

To manipulate blocks, you can utilize several primary APIs under `page`:

- [`page.addBlock`](/api/@blocksuite/store/classes/Page.html#addblock)
- [`page.updateBlock`](/api/@blocksuite/store/classes/Page.html#updateblock)
- [`page.deleteBlock`](/api/@blocksuite/store/classes/Page.html#deleteblock)
- [`page.getBlockById`](/api/@blocksuite/store/classes/Page.html#getblockbyid)

Here is an example demonstrating the manipulation of the block tree through these APIs:

```ts
// The first block will be added as root
const rootId = page.addBlock('affine:page');

// Insert second block as a child of the root with empty props
const noteId = page.addBlock('affine:note', {}, rootId);

// You can also provide an optional `parentIndex`
const paragraphId = page.addBlock('affine:paragraph', {}, noteId, 0);

const modelA = page.root!.children[0].children[0];
const modelB = page.getBlockById(paragraphId);
console.log(modelA === modelB); // true

// Update the paragraph type to 'h1'
page.updateBlock(modelA, { type: 'h1' });

page.deleteBlock(modelA);
```

This example creates a subset of the block tree hierarchy defaultly used in `@blocksuite/presets`, illustrated as follows:

![block-nesting](./images/block-nesting.png)

As a document-centric framework, **you need to initialize a valid document structure before attaching it to editors**, which is also why it requires `init()` after `createEmptyPage()`. See [creating new block tree](./data-persistence#creating-new-block-tree) for more details.

::: info
The block tree hierarchy is specific to the preset editors. At the framework level, `@blocksuite/store` does **NOT** treat the "first-party" `affine:*` blocks with any special way. Feel free to add blocks from different namespaces for the block tree!
:::

All block operations on `page` are automatically recorded and can be reversed using [`page.undo()`](/api/@blocksuite/store/classes/Page.html#undo) and [`page.redo()`](/api/@blocksuite/store/classes/Page.html#redo). By default, operations within a certain period are automatically merged into a single record. However, you can explicitly add a history record during operations by inserting [`page.captureSync()`](/api/@blocksuite/store/classes/Page.html#capturesync) between block operations:

```ts
const rootId = page.addBlock('affine:page');
const noteId = page.addBlock('affine:note', {}, rootId);

// Capture a history record now
page.captureSync();

// ...
```

This is particularly useful when adding multiple blocks at once but wishing to undo them individually.

## Block Tree in Editor

To understand the common operations on the block tree in an editor environment, it's helpful to grasp the basic design of the editor. This can start with the following code snippet:

```ts
const { host } = editor;
const { spec, selection, command } = host.std;
```

Firstly, let's explain the newly introduced `host` and `std`, which are determined by the framework-agnostic architecture of BlockSuite:

- As [mentioned before](./component-types#composing-editors-by-blocks), the `editor.host` - also known as the [`EditorHost`](/api/@blocksuite/lit/) component, is a container for mounting block UI components. It handles the heavy lifting involved in mapping the **block tree** to the **component tree**.
- Regardless of the framework used to implement `EditorHost`, they can access the same headless standard library designed for editable blocks through `host.std`. For example, `std.spec` contains all the registered [`BlockSpec`](./block-spec)s.

::: tip
We usually access `host.spec` instead of `host.std.spec` to simplify the code.
:::

As the runtime for the block tree, this is the mental model inside the `editor`:

![editor-structure](./images/editor-structure.png)

## Selecting Blocks

TODO

## Customizing Blocks

TODO
