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

The BlockSuite project aims to provide a toolkit for building collaborative editors. It creates a tech stack suitable for general-purpose structured content editing, and builds upon that to implement various first-party editors. By leveraging **_blocks_** as the fundamental primitive, all BlockSuite-based editors share high compatibility, and can even be dynamically switched as different view layers at runtime.

> ⚠️ BlockSuite is already in use in the production environment of [AFFiNE](https://github.com/toeverything/AFFiNE), but it's still under heavy development and undergoing rapid changes. Stay tuned or check out our [roadmap](https://github.com/orgs/toeverything/projects/10)!

## Introduction

BlockSuite was originally designed for the [AFFiNE](https://github.com/toeverything/AFFiNE) knowledge base. In AFFiNE, the same piece of data can be presented in various forms including documents, whiteboards, and tables. Users can smoothly switch among these different forms with real-time collaboration support. To this end, BlockSuite focuses on utilizing blocks as its primitive element to create a standardized collaborative editing engine. This consists of the following modules:

- ⚡️ **CRDT-Driven Block State Management**: The block tree model in BlockSuite is implemented using the [Yjs](https://github.com/yjs/yjs) CRDT library. Acting like a conflict-free Git, CRDT ([conflict-free replicated data type](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)) enables the editor to have built-in conflict resolution and time travel capabilities. By using CRDT as the single source of truth, all editors based on BlockSuite are natively collaborative. Plus, CRDT is [blazingly](https://josephg.com/blog/crdts-go-brrr/) [fast](https://blog.kevinjahns.de/are-crdts-suitable-for-shared-editing/).
- ⚛️ **Atomic Block UI Components**: In BlockSuite, blocks act like molecules, which can be further assembled from other blocks or more atomic components. These atomic components include rich-text and canvas renderers. For example, in BlockSuite, 100 paragraph blocks will generate 100 instances of rich-text components, and a form block could connect to multiple rich-text components. All these rich-text instances are linked to the same CRDT block tree, ensuring the cross-block editing operations can be consistently managed. Additionally, BlockSuite editors and blocks are all defined as [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components), making them easily integratable with other frameworks.
- 🎨 **Adaptable Selection Manager**: BlockSuite models operations on abstract selection states, allowing for the extension of various types of selections that are well-suited for multi-user collaboration.
- 💾 **Content Transformation and Serialization**: BlockSuite supports JSON-based document snapshots and offers extensibility for compatibility with third-party formats. It also provides auxiliary tools for managing forward and backward compatibility, as well as data validation and migration issues.
- 📡 **Providers for Data Synchronization**: The document state in BlockSuite can be serialized into binary and distributed through various providers, allowing for transmission via WebSocket, or storage into persistent backends like SQLite or IndexedDB. Thanks to their support for on-demand loading and incremental updates, these providers work efficiently.

Based on this framework, BlockSuite has already implemented editing capabilities for various types of structured data:

- [Rich text editor](https://blocksuite-toeverything.vercel.app/starter/?init)
- [Whiteboard editor](https://blocksuite-toeverything.vercel.app/)
- [Table editor (with kanban view support)](https://blocksuite-toeverything.vercel.app/starter/?init=database)

Visit [blocksuite.affine.pro](https://blocksuite.affine.pro/blocksuite-overview.html) for a more detailed overview!

## Resources

- 🎁 Examples
  - [Nightly Playground](https://blocksuite-toeverything.vercel.app/starter/?init)
  - [The `SimpleAffineEditor` Example](https://blocksuite-toeverything.vercel.app/examples/basic/)
  - [BlockSuite Monorepo in StackBlitz](https://stackblitz.com/github/toeverything/blocksuite)
  - [Vue-based BlocksVite Editor](https://github.com/zuozijian3720/blocksvite)
- 🚧 [Documentation](https://blocksuite.affine.pro/blocksuite-overview.html)
- 🗓️ [GitHub Project](https://github.com/orgs/toeverything/projects/22)
- 📍 [GitHub Issues](https://github.com/toeverything/blocksuite/issues)
- 🎙️ [GitHub Discussions](https://github.com/toeverything/blocksuite/discussions)
- 💬 [Discord Channel](https://discord.gg/9vwSWmYYcZ)
- 🏠 [AFFiNE Community](https://community.affine.pro/c/open-development/)
- 🚀 [Releases](https://github.com/toeverything/blocksuite/releases)

## Getting Started

To learn how to start using BlockSuite, visit [blocksuite.affine.pro](https://blocksuite.affine.pro/getting-started.html).

## Building

See [BUILDING.md](BUILDING.md) for instructions on how to build BlockSuite from source code.

## Contributing

BlockSuite accepts pull requests on GitHub. **Before you start contributing, please make sure you have read and accepted our [Contributor License Agreement](https://github.com/toeverything/blocksuite/edit/master/.github/CLA.md).** To indicate your agreement, simply edit this file and submit a pull request.

## License

[MPL 2.0](./LICENSE)
