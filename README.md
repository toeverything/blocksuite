# BlockSuite

[![Checks Status](https://img.shields.io/github/checks-status/toeverything/blocksuite/master)](https://github.com/toeverything/blocksuite/actions?query=branch%3Amaster)
[![Issues Closed](https://img.shields.io/github/issues-closed/toeverything/blocksuite?color=6880ff)](https://github.com/toeverything/blocksuite/issues?q=is%3Aissue+is%3Aclosed)
[![NPM Latest Release](https://img.shields.io/npm/v/@blocksuite/store.svg?maxAge=300&color=6880ff)](./packages/store/package.json)
[![NPM Nightly Release](https://img.shields.io/npm/v/@blocksuite/editor/nightly?color=6880ff)](https://github.com/toeverything/blocksuite/actions/workflows/nightly-release.yml?query=branch%3Amaster)

💠 BlockSuite is an open-source collaborative editor project behind [AFFiNE](https://github.com/toeverything/AFFiNE), an open-source knowledge base that attempts to combine the best of Notion and Miro altogether. In this monorepo, we maintain multiple abstraction layers of the editor and some core modules that can be reused externally.

[Try BlockSuite-based AFFiNE Alpha editor](https://pathfinder.affine.pro/)

## Introduction

BlockSuite works very differently from traditional rich text editors:

- For the data model, BlockSuite does not implement the [event sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) pattern but instead provides a CRDT-based block tree based directly on [Yjs](https://github.com/yjs/yjs), supporting zero-cost time travel and real-time collaboration out of the box. Its data persistence layer is also designed to be [local-first](https://martin.kleppmann.com/papers/local-first.pdf).
- For rich text editing, multiple different nodes in the BlockSuite block tree can be connected to different rich text editing components, thus modeling rich text content as multiple _UI components_ instead of a single _UI container_, eliminating the use of the dangerous monolith [`contenteditale`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable).
- For the rendering layer, BlockSuite does not assume that content can only be rendered via the DOM. Not only does it implement a basic document editing UI based on [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components), but it is also developing a hybrid canvas-based renderer for parts of the whiteboard content. Both renderers can co-exist on the same page and get updated through the same store.

BlockSuite is not intended to be yet another plugin-based rich text editing framework. Instead, **it encourages building different collaborative applications directly through whatever UI framework you're comfortable with**. To that end, we will try to open-source more basic modules for this in the BlockSuite project.

Although BlockSuite is still in its early stage, you can already use the `@blocksuite/editor` package, the collaborative editor AFFiNE Alpha used. Note that this editor is also a Web Component and is totally framework-agnostic!

## Current Status (`@blocksuite/editor`)

> ⚠️ This project is under heavy development and is in a stage of rapid evolution. Stay tuned!

- Basic text editing
  - ✅ Paragraph with inline style
  - ✅ Nested list
  - ✅ Code block
  - ✅ Markdown shortcuts
- Block-level editing
  - ✅ Inline text format bar
  - ⚛️ Block-level selection
  - ⚛️ Block drag handle
  - ⚛️ Block hub
  - ⚛️ Inline slash menu
- Rich-content
  - ⚛️ Image block
  - 🚧 Database block
  - 📌 Third-party embedded block
- Whiteboard (edgeless mode)
  - ✅ Zooming and panning
  - ⚛️ Frame block
  - 🚧 Shape element
  - 🚧 Handwriting element
  - 📌 Grouping
- Playground
  - ✅ Multiplayer collaboration
  - ✅ Local data persistence
  - ✅ E2E test suite
- Developer experience
  - ✅ Block tree update API
  - ✅ Zero cost time travel (undo/redo)
  - ✅ Reusable NPM package
  - ⚛️ React hooks integration
  - 📌 Dynamic block registration

Icons above correspond to the following meanings:

- ✅ - **Beta**
- ⚛️ - **Alpha**
- 🚧 - **Developing**
- 📌 - **Planned**

## Resources

- 🎁 Examples
  - [Latest Playground](https://block-suite.pages.dev/?init)
  - [AFFiNE Alpha Editor](https://pathfinder.affine.pro/)
  - [Multiple Workspace Example with React](https://blocksuite-react.vercel.app/)
- 📍 [GitHub Issues](https://github.com/toeverything/blocksuite/issues)
- 🎙️ [GitHub Discussions](https://github.com/toeverything/blocksuite/discussions)
- 🏠 [AFFiNE Community](https://community.affine.pro/c/open-development/)
- 🚀 [Releases](https://github.com/toeverything/blocksuite/releases)

## Getting Started with the Prebuilt Editor

To use the BlockSuite-based editor built into AFFiNE, three core packages are required to be imported:

- The `packages/store` package is a data store built for general-purpose state management.
- The `packages/blocks` package holds the default BlockSuite editable blocks.
- The `packages/editor` package ships a complete BlockSuite-based editor.

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
// A workspace can hold multiple pages, and a page can hold multiple blocks.
import { Workspace, Page } from '@blocksuite/store';
import { BlockSchema } from '@blocksuite/blocks/models';
import { EditorContainer } from '@blocksuite/editor';

/**
 * Manually create the initial page structure.
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

## Building

See [BUILDING.md](BUILDING.md) for instructions on how to build BlockSuite from source code.

## License

[MPL 2.0](./LICENSE)
