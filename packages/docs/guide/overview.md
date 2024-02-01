# BlockSuite Overview

BlockSuite is a toolkit for building diverse collaborative editors and applications. It implements a series of collaborative editing infrastructures and editors independently.

With BlockSuite, you can:

- Reuse multiple first-party BlockSuite editors right out of the box:
  - [**`DocEditor`**](../components/doc-editor): A comprehensive block-based document editor, offering extensive customization and flexibility.
  - [**`EdgelessEditor`**](../components/edgeless-editor): A graphicis editor featuring canvas-based graphics rendering, but also shares the same rich-text capabilities with the `DocEditor`.
- Or, build new editors from scratch based on the underlying vallina framework.

> 🚧 BlockSuite is currently in its early stage, with components and extension capabilities still under refinement. Hope you can stay tuned, try it out, or share your feedback!

## Motivation

BlockSuite originated from the open-source knowledge base [AFFiNE](https://github.com/toeverything/AFFiNE), with design goals including:

- **Support for Multimodal Editable Content**: When considering knowledge as a single source of truth, building its various view modes (e.g., text, slides, mind maps, tables) still requires multiple incompatible frameworks. Ideally, no matter how the presentation of content changes, there should be a consistent framework that helps.
- **Organizing and Visualizing Complex Knowledge**: Existing editors generally focus on editing single documents, but often fall short in dealing with complex structures involving intertwined references. This requires the framework to natively manage state across multiple documents.
- **Collaboration-Ready**: Real-time collaboration is often seen as an optional plugin, but in reality, we should natively use the underlying CRDT technology for editor state management, which helps to build a [clearer and more reliable data flow](../blog/crdt-native-data-flow).

During the development of AFFiNE, it became clear that BlockSuite was advancing beyond merely being an in-house editor and evolving into a versatile framework. That's why we chose to open source and maintain BlockSuite independently.

## Features

With BlockSuite editors, you can selectively reuse all the editing features in [AFFiNE](https://affine.pro/):

[![affine-demo](../images/affine-demo.jpg)](https://affine.pro)

And under the hood, the vanilla BlockSuite framework supports:

- Defining [custom blocks](./working-with-block-tree#defining-new-blocks) and inline embeds.
- Incremental updates, real-time collaboration, and even decentralized data synchronization based on the [document streaming](./data-synchronization#document-streaming) mechanism.
- Writing type-safe complex editing logic based on the [command](./command) mechanism, similar to react hooks designed for document editing.
- Persistence of documents and compatibility with various third-party formats (such as markdown and HTML) based on block [snapshot](./data-synchronization#snapshot-api) and transformer.
- State scheduling across multiple documents and reusing one document in multiple editors.

To try out BlockSuite, refer to the [Quick Start](./quick-start) example and start with the preset editors in `@blocksuite/presets`.

## Architecture

The BlockSuite project is structured around key packages that are categorized into two groups: a headless [framework](https://github.com/toeverything/blocksuite/tree/master/packages) and prebuilt editing components.

<table>
  <tr>
    <th colspan="2">Framework</th>
  </tr>
  <tr>
    <td><code>@blocksuite/store</code></td>
    <td>Data layer for modeling collaborative document states. It is natively built on the CRDT library <a href="https://github.com/yjs/yjs">Yjs</a>, powering all BlockSuite documents with built-in real-time collaboration and time-travel capabilities.</td>
  </tr>
  <tr>
    <td><code>@blocksuite/inline</code></td>
    <td>Minimal rich text components for inline editing. BlockSuite allows spliting rich text content in different block nodes into different inline editors, making complex content conveniently composable. <strong>This significantly reduces the complexity required to implement traditional rich text editing features.</strong></td>
  </tr>
  <tr>
    <td><code>@blocksuite/block-std</code></td>
    <td>Framework-agnostic library for modeling editable blocks. Its capabilities cover the structure of block fields, events, selection, clipboard support, etc.</td>
  </tr>
  <tr>
    <td><code>@blocksuite/lit</code></td>
    <td>Intermediate layer for adapting the block tree to the <a href="https://lit.dev/">lit</a> framework component tree UI. BlockSuite uses lit as the default framework because lit components are native web components, avoiding synchronization issues between the component tree and DOM tree during complex editing.</td>
  </tr>
</table>

<table>
  <tr>
    <th colspan="2">Components</th>
  </tr>
  <tr>
    <td><code>@blocksuite/blocks</code></td>
    <td>Default block implementations for composing preset editors, including widgets belonging to each block.</td>
  </tr>
  <tr>
    <td><code>@blocksuite/presets</code></td>
    <td>Plug-and-play editable components including <i>editors</i> (<code>DocEditor</code> / <code>EdgelessEditor</code>) and auxiliary UI components named <i>fragments</i> (<code>CopilotPanel</code>, <code>DocTitle</code>...).</td>
  </tr>
</table>

This can be illustrated as the diagram below:

![package-overview.png](../images/package-overview.png)
