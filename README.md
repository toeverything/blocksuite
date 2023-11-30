# BlockSuite

<p align="center">
  <picture style="width: 500px">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/toeverything/blocksuite/master/assets/logo-and-name-h.svg" />
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/toeverything/blocksuite/master/assets/logo-and-name-h-white.svg" />
    <img src="https://raw.githubusercontent.com/toeverything/blocksuite/master/assets/logo-and-name-h.svg" width="500" alt="BlockSuite logo and name" />
  </picture>
</p>

[![Codecov](https://codecov.io/gh/toeverything/blocksuite/branch/master/graph/badge.svg?token=T86JYCDSMN)](https://codecov.io/gh/toeverything/blocksuite)
[![Checks Status](https://img.shields.io/github/checks-status/toeverything/blocksuite/master)](https://github.com/toeverything/blocksuite/actions?query=branch%3Amaster)
[![Issues Closed](https://img.shields.io/github/issues-closed/toeverything/blocksuite?color=6880ff)](https://github.com/toeverything/blocksuite/issues?q=is%3Aissue+is%3Aclosed)
[![NPM Latest Release](https://img.shields.io/npm/v/@blocksuite/store.svg?maxAge=300&color=6880ff)](./packages/store/package.json)
[![NPM Nightly Release](https://img.shields.io/npm/v/@blocksuite/editor/nightly?color=6880ff)](https://github.com/toeverything/blocksuite/actions/workflows/nightly-release.yml?query=branch%3Amaster)
[![Open in StackBlitz](https://img.shields.io/badge/open%20in-StackBlitz-black)](https://stackblitz.com/github/toeverything/blocksuite)
[![Join Discord](https://img.shields.io/discord/959027316334407691)](https://discord.gg/9vwSWmYYcZ)

---

## Overview

BlockSuite is an open-source project for block-based collaborative editing. This repository contains two essential parts:

- **A framework** for building block-based [structure editors](https://en.wikipedia.org/wiki/Structure_editor), providing foundational support for editor essentials such as [block schema](https://blocksuite.affine.pro/block-schema.html), [selection](https://blocksuite.affine.pro/selection-api.html), [rich text](https://github.com/toeverything/blocksuite/tree/master/packages/virgo), [real-time collaboration](https://blocksuite.affine.pro/unidirectional-data-flow.html), and [UI component definition](https://blocksuite.affine.pro/block-view.html).
- **Multiple first-party editors** capable of handling documents, whiteboards, and data grids. These editors are highly interoperable, and are already used by the [AFFiNE](https://github.com/toeverything/AFFiNE) project.

By using BlockSuite, you can:

- Reuse and extend block-based editors, like [document editor](https://try-blocksuite.vercel.app/starter/?init) and [whiteboard editor](https://try-blocksuite.vercel.app/).
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
- `@blocksuite/playground`: Default editor playground with local-first data persistence and real-time collaboration support.

## Why BlockSuite?

- 🧬 **CRDT-Native Collaboration**: At the heart of BlockSuite is its native use of CRDTs ([Conflict-free Replicated Data Types](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)) as the single source of truth for data flow. This design sets it apart from traditional editors that often graft on real-time collaboration. By integrating CRDTs at its core, BlockSuite inherently supports advanced features like time travel (undo/redo) and automatic conflict resolution. This means smoother, more reliable collaborative editing without the need for additional layers or complex integrations.
- 🧩 **Rich Text Orchestration Across Blocks**: BlockSuite diverges from the conventional monolithic rich text edit model. It enables each block to support its own atomic rich text component. This allows for granular control and flexibility in editing, which is especially powerful in complex documents where different sections require varied formatting and features.
- 🎨 **Reusable Blocks Across Editors**: BlockSuite provides great interoperability of custom blocks across different editor types (document, whiteboard, etc.). This allows for a more consistent and efficient use of blocks, simplifying the development process by enabling the same block to function seamlessly in various editing environments.
- 🔌 **Plug-and-Play Data Synchronization**: BlockSuite simplifies data synchronization with its provider-based approach. Connecting an editor instance to a provider automatically enables data synchronization. It supports incremental data sync, meaning only the changes are transmitted, enhancing efficiency and performance. It eliminates the need for explicit requests or complex synchronization logic, streamlining DX and ensuring data consistency across collaborative environments.

> 🚧 BlockSuite is currently in beta, with some extension capabilities still under refinement. Hope you can stay tuned, try it out, or share your feedback!

## Getting Started

To learn how to start using BlockSuite, visit [blocksuite.affine.pro](https://blocksuite.affine.pro/quick-start.html).

## Resources

- 🎁 Examples
  - [Nightly Playground](https://try-blocksuite.vercel.app/starter/?init)
  - [The `SimpleAffineEditor` Example](https://try-blocksuite.vercel.app/examples/basic/)
  - [BlockSuite Monorepo in StackBlitz](https://stackblitz.com/github/toeverything/blocksuite)
  - [Vue-based BlocksVite Editor](https://github.com/zuozijian3720/blocksvite)
- 📝 [Documentation](https://blocksuite.affine.pro/quick-start.html)
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
