# BlockSuite

<a href="./packages/store/package.json">
  <img src="https://img.shields.io/npm/v/@blocksuite/store.svg?maxAge=300&color=6880ff"/>
</a>

BlockSuite is a collaborative editing framework designed to reliably reconcile any Web content.

[Try BlockSuite-based AFFiNE alpha editor](https://pathfinder.affine.pro/)

> ⚠️ This project is under heavy development and is in a stage of rapid evolution. Stay tuned!

## Motivation

BlockSuite was created initially for [AFFiNE](https://github.com/toeverything/AFFiNE), an open source knowledge base that attempts to combine the best of Notion and Miro altogether. In reaching such a challenging goal, we came across many popular rich text editor frameworks available in the community. However, we found they shared some technical limitations, ones that we wanted to tackle:

- **Editable contents have to be rendered inside a monolithic `contenteditable` container**, all elements colored by which need to be handled carefully to avoid their vulnerability.
- **The view layer has to depend on specific UI framework**, making it difficult not only to dynamically reuse components implemented by different frameworks inside an editor, but also to embed the editor into different applications.
- **Updating data requires some sort of non-generic domain model**, whose APIs are generally basic variations of the classic [event sourcing](https://martinfowler.com/eaaDev/EventSourcing.html) pattern and do not take advantage of the benefits from [breakthroughs](https://josephg.com/blog/crdts-go-brrr/) in collaborative editing that have occurred in recent years.

To overcome these limitations, we created a new editor architecture. And that's what BlockSuite is all about.

## The BlockSuite Approach

BlockSuite tries to blur the boundary between an editor and a regular Web app by following some principles:

- **Nested data, flat `contenteditable`s.** BlockSuite supports modeling complex structured data as nested blocks, all of which are rendered to plain standard DOM by default. However each rich text field inside these blocks are rendered into a separate `contenteditable` instance. This means that you can model a document with _N_ paragraphs as _N_ `ParagraphBlock`s, each of which can hold a separate rich-text editing component within it! This eliminates the need for BlockSuite to render everything in a single `contenteditable` element. Instead in BlockSuite, with just a simple rich text editing component based on a flat data structure (we use [Quill](https://quilljs.com/) for now), we can manage an editable UI with complex nested structure.
- **One store, multi editable instances.** To schedule state between different block instances, BlockSuite implements a centralized data store based on [Yjs](https://github.com/yjs/yjs), a state-of-the-art library for shared editing. The content in the editor can be split into multiple independent containers on the page, and as long as they all subscribe to the same store, all their historical states can be managed smoothly. Such an integration with Yjs also makes BlockSuite collaboration-ready by design and by default.
- **One model, exchangeable components.** To make BlockSuite-based editors compatible with any UI components and embeddable for any framework-based Web application, BlockSuite uses [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) as its interchangeable view layer by default. This not only allows for better reuse of the community ecosystem, but also improves rich-text editing stability by directly reusing the native DOM-based component model. To demonstrate this, BlockSuite has provided a document mode container and a whiteboard mode container that share the same data model structure and can be dynamically switched between, both are powered by [Lit](https://lit.dev/), an ultralight Web Components framework.

## Getting Started

For now, the BlockSuite team is focusing on developing first-party blocks built for AFFiNE, its developer documentation is not yet complete. But the project structure in this repository should already demonstrate some key points about how it's supposed to be reused as a progressive framework:

- The `packages/store` package is a data store built for general purpose state management.
- The `packages/blocks` package holds the default BlockSuite editable blocks.
- The `packages/editor` package ships a complete BlockSuite-based editor.

Read on to see how to play with BlockSuite!

## Development

Setting up basic local environment:

```bash
# install dependencies
pnpm i

# start vite playground
pnpm dev
```

To test locally, please make sure browser binaries are already installed via `npx playwright install` and Vite playground is started with `pnpm dev`. Then there are multi commands to choose from:

```bash
# run tests in headless mode in another terminal window
pnpm test

# or run tests in headed mode for debugging
pnpm test:headed
```

In headed mode, `await page.pause()` can be used in test cases to suspend the test runner.

## License

[MPL 2.0](./LICENSE)
