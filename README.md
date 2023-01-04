# BlockSuite

[![NPM Nightly Release](https://img.shields.io/npm/v/@blocksuite/editor/nightly)](https://github.com/toeverything/blocksuite/actions/workflows/nightly-release.yml?query=branch%3Amaster)
<a href="./packages/store/package.json">
<img src="https://img.shields.io/npm/v/@blocksuite/store.svg?maxAge=300&color=6880ff"/>
</a>

<!--
<a href="https://join.slack.com/t/blocksuitedev/shared_invite/zt-1h0zz3b8z-nFpWSu6a6~yId7PxiMcBHA">
  <img src="https://img.shields.io/badge/-Slack-grey?logo=slack">
</a>
<a href="https://twitter.com/BlockSuiteDev">
  <img src="https://img.shields.io/badge/-Twitter-grey?logo=twitter">
</a>
-->

BlockSuite is a framework providing building blocks for collaborative applications. With BlockSuite, you can build complex applications with fine-grained collaborative features, without going down the rabbit hole of rich text editors and conflict resolution algorithms.

[Try BlockSuite-based AFFiNE Alpha editor](https://pathfinder.affine.pro/)

> ⚠️ This project is under heavy development and is in a stage of rapid evolution. Stay tuned!

## Introduction

BlockSuite was created initially for [AFFiNE](https://github.com/toeverything/AFFiNE), an open source knowledge base that attempts to combine the best of Notion and Miro altogether. In reaching such a challenging goal, we found that based on recent tech breakthroughs, we actually don't have to manage all editable content inside a monolith `contenteditable` container like traditional rich text editors. **Instead, based on BlockSuite, regardless of a TodoMVC, a dashboard, or a block-based knowledge base that supports multi-user collaboration, they can all be modeled into regular UI components and rendered to standard DOM, sharing the same object model and mental model**.

BlockSuite provides a toolset for assembling collaborative applications:

- 🚧 **A centralized store** that serves as a real-time collaborative state management library. It is built on top of [Yjs](https://github.com/yjs/yjs) and supports zero cost time travel, subscription-based reactivity, and incremental state synchronization over different data persistence layers.
- 🚧 **A set of block UI components** based on [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components). They are framework agnostic and can be reused or extended on demand.
- 🚧 **A collaborative editor** built on top of the above blocks and store. It's also a Web Component and can be embedded directly into any Web application.

To support a smooth rich-text editing experience, BlockSuite also provides a RichText component. Each RichText instance uses a flat data structure and can be placed as a leaf component in a complex nesting UI. This ensures the stability of rich-text editing (currently based on [Quill](https://quilljs.com/)), but also enables the modeling of complex application states. Since **BlockSuite can reconcile the state of multiple rich text instances**, this eliminates the need for collaborative applications being tied into a single `contenteditable`.

As an example, in the BlockSuite based [AFFiNE Alpha](https://pathfinder.affine.pro/) editor, you may not feel that this editor is actually a composition of multiple RichText components (check out DevTools 👀). This demonstrates the flexibility and extensibility of BlockSuite.

## Resources

- 🚧 [Introduction](https://github.com/toeverything/blocksuite#introduction)
- 🚧 [Getting Started](https://github.com/toeverything/blocksuite#getting-started)
- 🚧 Examples
  - [Latest Playground](https://block-suite.pages.dev/?init)
  - [AFFiNE Alpha Editor](https://pathfinder.affine.pro/)
  - [Multiple Workspace Example with React](https://blocksuite-react.vercel.app/)
- 🚧 API Reference
- 🚧 Troubleshooting
- 🚧 [Releases](https://github.com/toeverything/blocksuite/releases)

## Help & Community

- [GitHub Discussions](https://github.com/toeverything/blocksuite/discussions)
- [Slack Channel](https://join.slack.com/t/blocksuitedev/shared_invite/zt-1h0zz3b8z-nFpWSu6a6~yId7PxiMcBHA)
- [AFFiNE Community](https://community.affine.pro/c/open-development/)
- [Twitter](https://twitter.com/BlockSuiteDev)

## Getting Started

The BlockSuite team now focuses on developing first-party blocks built for AFFiNE. Its developer documentation is not yet complete. But the project structure in this repository should already demonstrate some critical points about how it’s supposed to be reused as a progressive framework:

- The `packages/store` package is a data store built for general purpose state management.
- The `packages/blocks` package holds the default BlockSuite editable blocks.
- The `packages/editor` package ships a complete BlockSuite-based editor.
- The `packages/react` package is a components and hooks library for React.js.

This will install the latest BlockSuite packages into your project:

```sh
pnpm i \
  @blocksuite/store@nightly \
  @blocksuite/blocks@nightly \
  @blocksuite/editor@nightly
```

And here is a minimal collaboration-ready editor showing how the BlockSuite packages are composed together:

```ts
import '@blocksuite/blocks';
// A workspace can hold multiple pages and a page can hold multiple blocks.
import { Workspace, Page } from '@blocksuite/store';
import { BlockSchema } from '@blocksuite/blocks/models';
import { EditorContainer } from '@blocksuite/editor';

/**
 * Manually create initial page structure.
 * In collaboration mode or on page refresh with local persistence,
 * the page data will be automatically loaded from store providers.
 * In these cases, this function should not be called.
 */
function createInitialPage(workspace: Workspace) {
  // Events are being emitted using signals.
  workspace.signals.pageAdded.once(id => {
    const page = workspace.getPage(id) as Page;

    // Block types are defined and registered in BlockSchema.
    const pageBlockId = page.addBlock({ flavour: 'affine:page' });
    const frameId = page.addBlock({ flavour: 'affine:frame' }, pageBlockId);
    page.addBlock({ flavour: 'affine:paragraph' }, frameId);
  });

  // Create a new page. This will trigger the signal above.
  workspace.createPage('page0');
}

// Subscribe for page update and create editor on page added.
function initEditorOnPageAdded(workspace: Workspace) {
  workspace.signals.pageAdded.once(pageId => {
    const page = workspace.getPage(pageId) as Page;
    const editor = new EditorContainer();
    editor.page = page;
    document.body.appendChild(editor);
  });
}

function main() {
  // Initialize the store.
  const workspace = new Workspace({}).register(BlockSchema);

  // Start waiting for the first page...
  initEditorOnPageAdded(workspace);

  // Suppose we are the first one to create the page.
  createInitialPage(workspace);
}

main();
```

For React developers, check out the [`@blocksuite/react`](./packages/react/README.md) doc for React components and hooks support.

## Local Development

Setting up basic local environment:

```bash
# install dependencies
pnpm i

# start vite playground
pnpm dev
```

The example page should work at [http://localhost:5173/?init](http://localhost:5173/?init)

To test locally, please make sure browser binaries are already installed via `npx playwright install` and Vite playground is started with `pnpm dev`. Then there are multi commands to choose from:

```bash
# run tests in headless mode in another terminal window
pnpm test

# or run tests in headed mode for debugging
pnpm test:headed
```

In headed mode, `await page.pause()` can be used in test cases to suspend the test runner. Note that the usage of the [Playwright VSCode extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright) is also highly recommended.

## License

[MPL 2.0](./LICENSE)
