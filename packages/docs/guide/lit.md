# `@blocksuite/lit`

Intermediate layer for adapting the block tree to the [lit](https://lit.dev/) framework component tree UI.

BlockSuite uses lit as the default framework because lit components are native web components, avoiding synchronization issues between the component tree and DOM tree during complex editing.

The [`EditorHost`](/api/@blocksuite/block-std/classes/EditorHost.html) is a lit component that works as the DOM host of the block tree, and the [`BlockElement`](/api/@blocksuite/block-std/classes/BlockElement.html) and [`WidgetElement`](/api/@blocksuite/block-std/classes/WidgetElement.html) are standard lit components for extending UI components of block and widget.

::: tip
Lit components extends `HTMLElement`, so all DOM-related properties are inherited.
:::
