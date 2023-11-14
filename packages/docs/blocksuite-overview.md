# BlockSuite Overview

BlockSuite is an open-source project for block-based collaborative editing. It contains two essential parts:

- **A framework** for building block-based [structure editors](https://en.wikipedia.org/wiki/Structure_editor), providing foundational support for editor essentials such as [block schema](https://blocksuite.affine.pro/block-schema.html), [selection](https://blocksuite.affine.pro/selection-api.html), [rich text](https://github.com/toeverything/blocksuite/tree/master/packages/virgo), [real-time collaboration](https://blocksuite.affine.pro/unidirectional-data-flow.html), and [UI component definition](https://blocksuite.affine.pro/block-view.html).
- **Multiple first-party editors** capable of handling documents, whiteboards, and data grids. These editors are highly interoperable, and are already used by the [AFFiNE](https://github.com/toeverything/AFFiNE) project.

By using BlockSuite, you can:

- Reuse and extend block-based editors, like [document editor](https://blocksuite-toeverything.vercel.app/starter/?init) and [whiteboard editor](https://blocksuite-toeverything.vercel.app/).
- Define custom blocks that could be shared across these editors.
- Synchronize editor states over different providers (`IndexedDB`, `WebSocket`, `BroadcastChannel`, etc.) while automatically resolving merge conflicts.
- Support document snapshot, clipboard, and interoperability with third-party formats through a universal data transforming model.
- Fully construct your own block-based editor from scratch.

The major packages in BlockSuite include the following:

- `@blocksuite/store`: CRDT-driven block state management, enabling editors to have built-in conflict resolution and time travel capabilities.
- `@blocksuite/block-std`: The standard toolkit for working with editable blocks, including selections, events, services, commands and more.
- `@blocksuite/lit`: The default view layer for rendering blocks and widgets as [web components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components). It's built on top of [lit](https://lit.dev/) and the headless `block-std`, and could be replaced by alternative frameworks.
- `@blocksuite/virgo`: Atomic rich text _component_ used in BlockSuite. Every editable block could hold its own virgo instances, leveraging the store to reconcile the block tree.
- `@blocksuite/blocks`: Editable first-party blocks under the `affine` scope. The default AFFiNE editors are simply different implementations of the `affine:page` blocks.
- `@blocksuite/editor`: The ready-to-use editors composed by blocks.
