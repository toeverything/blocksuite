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
[![Open in CodeSandbox](https://img.shields.io/badge/open%20in-CodeSandbox-black)](https://codesandbox.io/p/github/toeverything/blocksuite/master)
[![Join Discord](https://img.shields.io/discord/959027316334407691)](https://discord.gg/9vwSWmYYcZ)

---

BlockSuite is the open-source editor project behind [AFFiNE](https://github.com/toeverything/AFFiNE). It provides an out-of-the-box block-based editor built on top of a framework designed for general-purpose collaborative applications. This monorepo maintains both the editor and the underlying framework.

![BlockSuite-based Editor in AFFiNE](https://user-images.githubusercontent.com/79301703/230893796-dc707955-e4e5-4a42-a3c9-18d1ea754f6f.gif)

<p align="center">BlockSuite-based Editor in AFFiNE</p>

- 👉 [Try BlockSuite-based AFFiNE online](https://app.affine.pro/)
- 🚀 [Edit this page in BlockSuite](https://codesandbox.io/p/sandbox/blocksuite-starter-316rct?file=%2Fsrc%2Fmain.ts)

> ⚠️ This project is under heavy development and is in a stage of rapid evolution. Stay tuned or [see our roadmap here](https://github.com/orgs/toeverything/projects/10)!

## Introduction

BlockSuite works very differently than traditional rich text frameworks. Feature highlights:

- 📝 **Block-Based Editing**: BlockSuite breaks down rich content into discrete contenteditable blocks, avoiding pitfalls using traditional monolithic rich text container.
- 🧬 **Intrinsically Collaborative**: By harnessing the power of CRDT, any application built with BlockSuite effortlessly supports real-time collaboration right from the start.
- 🧩 **Framework Agnostic**: With UI components implemented using Web Components, BlockSuite provides editors that can be easily embedded and eliminates the risk of vendor lock-in.
- 🎯 **Incremental State Sync**: The state updates in BlockSuite can be incrementally encoded as standardized binaries, enabling efficient data synchronization over various network protocols.
- 📏 **Compact Rich Text**: BlockSuite builds its own rich text component. With minimal responsibilities that benefits from the block-based architecture, this component is light, simple and reliable.
- 🎨 **Hybrid Infinite Canvas**: A high performance canvas-based renderer is also provided by BlockSuite, fulfilling needs for whiteboard functionalities.

Check out [blocksuite.affine.pro](https://blocksuite.affine.pro/blocksuite-overview.html) for a detailed overview!

## Resources

- 🎁 Examples
  - [Nightly Playground](https://blocksuite-toeverything.vercel.app/?init) ([🔗 source](./packages/playground/src/main.ts))
  - [The `SimpleAffineEditor` Example](https://blocksuite-toeverything.vercel.app/examples/basic/) ([🔗 source](./packages/playground/examples/basic/index.html))
  - [AFFiNE Alpha Editor](https://app.affine.pro/) ([🔗 source](https://github.com/toeverything/AFFiNE/tree/master/apps/web))
  - [CodeSandbox Starter Template](https://codesandbox.io/p/sandbox/blocksuite-starter-316rct?file=%2Fsrc%2Fmain.ts)
  - [BlockSuite Monorepo in CodeSandbox](https://codesandbox.io/p/github/toeverything/blocksuite/master)
  - [Vue-based BlocksVite Editor](https://github.com/zuozijian3720/blocksvite)
- 📄 [Documentation](https://blocksuite.affine.pro/blocksuite-overview.html)
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
