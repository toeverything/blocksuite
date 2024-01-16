# BlockSuite

<p align="center">
  <picture style="width: 500px">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/toeverything/blocksuite/master/assets/logo-and-name-h.svg" />
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/toeverything/blocksuite/master/assets/logo-and-name-h-white.svg" />
    <img src="https://raw.githubusercontent.com/toeverything/blocksuite/master/assets/logo-and-name-h.svg" width="500" alt="BlockSuite logo and name" />
  </picture>
</p>

<!--
[![Codecov](https://codecov.io/gh/toeverything/blocksuite/branch/master/graph/badge.svg?token=T86JYCDSMN)](https://codecov.io/gh/toeverything/blocksuite)
-->

[![Checks Status](https://img.shields.io/github/checks-status/toeverything/blocksuite/master)](https://github.com/toeverything/blocksuite/actions?query=branch%3Amaster)
[![Issues Closed](https://img.shields.io/github/issues-closed/toeverything/blocksuite?color=6880ff)](https://github.com/toeverything/blocksuite/issues?q=is%3Aissue+is%3Aclosed)
[![NPM Latest Release](https://img.shields.io/npm/v/@blocksuite/store.svg?maxAge=300&color=6880ff)](./packages/store/package.json)
[![NPM Nightly Release](https://img.shields.io/npm/v/@blocksuite/presets/nightly?color=6880ff)](https://github.com/toeverything/blocksuite/actions/workflows/nightly-release.yml?query=branch%3Amaster)
[![Open in StackBlitz](https://img.shields.io/badge/open%20in-StackBlitz-black)](https://stackblitz.com/github/toeverything/blocksuite)
[![Join Discord](https://img.shields.io/discord/959027316334407691)](https://discord.gg/9vwSWmYYcZ)

---

## Overview

BlockSuite is a toolkit for building collaborative editors and applications. It embraces the [**_document-centric_**](https://blocksuite.io/design-philosophy.html) approach to facilitate the development of more flexible, diverse, and scalable editable interfaces.

In developing modern collaborative editing applications, the challenge lies not only in the internal implementation of the editor but also in the complex state management across many UI components. This means that the overall data flow of such applications should be consistently modeled and reused on a larger scale, reducing the interoperability cost between editor and non-editor components. **This is why BlockSuite completely separates the document model of collaborative content from the editor**. This allows any UI component, whether part of an editor or not, to simply **_attach_** to the same block tree document, **_composing_** a more flexible editing experience.

![showcase-doc-edgeless-editors](./packages/docs/images/showcase-doc-edgeless-editors.jpg)

For an understanding of the design philosophy advocated by BlockSuite, welcome to read our [_Document-Centric, CRDT-Native_](https://blocksuite.io/design-philosophy.html) post.

Based on this concept, BlockSuite starts with a foundational block-based document model and independently implements a series of collaborative editing infrastructures, including editors. This means that with BlockSuite, you can choose to:

- Build a new editor from scratch based on the BlockSuite framework.
- Or, reuse multiple first-party editors based on BlockSuite right out of the box:
  - [**`DocEditor`**](https://blocksuite.io/presets/doc-editor.html): **Built entirely from scratch**, `DocEditor` is a comprehensive block-based document editor, offering extensive customization and flexibility.
  - [**`EdgelessEditor`**](https://blocksuite.io/presets/edgeless-editor.html): **Featuring canvas-based graphics rendering** at its core with sophisticated rich-text features, `EdgelessEditor` offers unique functionalities and decent performance in whiteboard editing.

The BlockSuite project is structured around key packages that are categorized into two groups: a headless framework and prebuilt editing components.

<table>
  <tr>
    <th colspan="2">Headless Framework</th>
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
    <th colspan="2">Prebuilt Components</th>
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

![package-overview.png](./packages/docs/images/package-overview.png)

In addition to extending custom blocks, here are what you can also conveniently achieve with BlockSuite:

- Writing type-safe complex editing logic based on the [command](https://blocksuite.io/command.html) mechanism, similar to react hooks designed for document editing.
- Persistence of documents and compatibility with various third-party formats (such as markdown and HTML) based on block [snapshot](https://blocksuite.io/data-synchronization.html#snapshot-api) and transformer.
- Incremental updates, real-time collaboration, local-first state management, and even decentralized data synchronization based on the [document streaming](https://blocksuite.io/data-synchronization.html#document-streaming) mechanism of the document.
- State scheduling across multiple documents and reusing one document in multiple editors.

> 🚧 BlockSuite is currently in its early stage, with some extension capabilities still under refinement. Hope you can stay tuned, try it out, or share your feedback!

## Getting Started

To try out BlockSuite, refer to the [Quick Start](https://blocksuite.io/quick-start.html) document and start with the preset editors in `@blocksuite/presets`.

## Resources

- 🎁 Examples
  - [Nightly Playground](https://try-blocksuite.vercel.app/starter/?init)
  - [BlockSuite Monorepo in StackBlitz](https://stackblitz.com/github/toeverything/blocksuite)
  - [Vue-based BlocksVite Editor](https://github.com/zuozijian3720/blocksvite)
- 📝 [Documentation](https://blocksuite.io/quick-start.html)
- 📍 [Good First Issues](https://github.com/toeverything/blocksuite/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)
- 🎙️ [GitHub Discussions](https://github.com/toeverything/blocksuite/discussions)
- 💬 [Discord Channel](https://discord.gg/9vwSWmYYcZ)
- 🚀 [Releases](https://github.com/toeverything/blocksuite/releases)

## Building

See [BUILDING.md](BUILDING.md) for instructions on how to build BlockSuite from source code.

## Contributing

BlockSuite accepts pull requests on GitHub. **Before you start contributing, please make sure you have read and accepted our [Contributor License Agreement](https://github.com/toeverything/blocksuite/edit/master/.github/CLA.md).** To indicate your agreement, simply edit this file and submit a pull request.

## License

[MPL 2.0](./LICENSE)
