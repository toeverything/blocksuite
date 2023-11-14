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

## Getting Started

To learn how to start using BlockSuite, visit [blocksuite.affine.pro](https://blocksuite.affine.pro/getting-started.html).

## Resources

- 🎁 Examples
  - [Nightly Playground](https://blocksuite-toeverything.vercel.app/starter/?init)
  - [The `SimpleAffineEditor` Example](https://blocksuite-toeverything.vercel.app/examples/basic/)
  - [BlockSuite Monorepo in StackBlitz](https://stackblitz.com/github/toeverything/blocksuite)
  - [Vue-based BlocksVite Editor](https://github.com/zuozijian3720/blocksvite)
- 🚧 [Documentation](https://blocksuite.affine.pro/blocksuite-overview.html)
- 📍 [Good First Issues](https://github.com/toeverything/blocksuite/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)
- 🎙️ [GitHub Discussions](https://github.com/toeverything/blocksuite/discussions)
- 💬 [Discord Channel](https://discord.gg/9vwSWmYYcZ)
- 🏠 [AFFiNE Community](https://community.affine.pro/c/open-development/)
- 🚀 [Releases](https://github.com/toeverything/blocksuite/releases)

## Building

See [BUILDING.md](BUILDING.md) for instructions on how to build BlockSuite from source code.

## Contributing

BlockSuite accepts pull requests on GitHub. **Before you start contributing, please make sure you have read and accepted our [Contributor License Agreement](https://github.com/toeverything/blocksuite/edit/master/.github/CLA.md).** To indicate your agreement, simply edit this file and submit a pull request.

## License

[MPL 2.0](./LICENSE)
