# Flavoured Blocks

In BlockSuite, block is the basic unit of structured content, representing a piece of text, an image or other media elements, or even a nested sub-document. BlockSuite supports defining various types of blocks, referred to as **flavoured blocks**. By combining and nesting blocks, users can create richly structured and styled content.

The term "flavour" in blocks is inspired by the concept in physics and follows the `namespace:name` format. For example, we allow an `affine:paragraph` block to have similar sub-types, such as `h1`, `h2`, `h3`, `quote`, etc., which reduces redundant code and makes it easier for blocks with similar behavior to be converted between each other.

## Basic Block Operation APIs

In BlockSuite, the basic APIs for managing blocks include `addBlock`, `updateBlock`, and `deleteBlock`. These operations allow users to create, modify, and remove blocks within a `page`, providing an easy way to manage and organize the structured content.

The `page.addBlock` method takes two required arguments: `flavour` and `props`. The `flavour` argument is the type of block to be added, while `props` contains the properties for the new block. Optionally, you can use the `parent` and `parentIndex` arguments to specify the parent block and the index at which the new block should be inserted, respectively.

Example usage:

```ts
import { Text } from '@blocksuite/store';

const props = { text: new Text('New paragraph') };
const newBlockId = page.addBlock('affine:paragraph', props);
```

`page.addBlock` returns the auto-generated `id` of the added block, rather than the block instance. The block instance will be added synchronously to the page, and can be retrieved by calling `page.getBlockById(id)`.

::: info
These is a good reason behind this design, which is the key to make the APIs collaborative by default (🚧).
:::

The `page.updateBlock` method is used to modify the properties of an existing block. It takes two arguments: the block instance to be updated and an object containing the updated properties.

Example usage:

```ts
const props = { text: new Text('New paragraph') };
page.updateBlock(block, props);
```

Similarly, you can use the `page.deleteBlock` method to remove a block from the block tree.

::: tip
In [BlockSuite playground](https://blocksuite-toeverything.vercel.app/?init), you can run `workspace.doc.toJSON()` in the console to see the basic block structure in BlockSuite.
:::

## Basic Block Flavours

In the prebuilt editor, creating a simple page requires following block flavours: `affine:page`, `affine:frame`, and `affine:paragraph`.

- The `affine:page` block serves as the top-level container for a page, holding all other blocks within the page hierarchy.
- The `affine:frame` block acts as a flat container within the page, and multiple frames can be positioned on the whiteboard.
- Each `affine:paragraph` block holds a linear sequence of rich text within the page. It enables users to create text-based content and style it according to their needs.

::: tip
The `affine:frame` block is designed to interop with the whiteboard mode. If you only need the document editor, simply placing all other blocks within a single frame will be sufficient.
:::

To provide an out-of-the-box solution, the `affine:code`, `affine:list`, and `affine:embed` flavours are also built into the `AffineSchema` and can be freely reused.
