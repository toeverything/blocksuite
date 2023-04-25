# Attaching Editor

In the [Getting Started](./getting-started) section, we used a `SimpleAffineEditor`, which is a simple wrapper around the `EditorContainer` component. In this part, we will take a closer look at its [source code](https://github.com/toeverything/blocksuite/blob/master/packages/editor/src/components/simple-affine-editor.ts):

```ts
import { AffineSchemas } from '@blocksuite/blocks/models';
import type { Page } from '@blocksuite/store';
import { Workspace } from '@blocksuite/store';
import { LitElement } from 'lit';
import { EditorContainer } from './editor-container.js';

export class SimpleAffineEditor extends LitElement {
  readonly workspace: Workspace;
  readonly page: Page;

  constructor() {
    super();

    this.workspace = new Workspace({ id: 'foo' }).register(AffineSchemas);
    this.page = this.workspace.createPage({ init: true });
  }

  override connectedCallback() {
    const editor = new EditorContainer();
    editor.page = this.page;
    this.appendChild(editor);
  }

  override disconnectedCallback() {
    this.removeChild(this.children[0]);
  }
}
```

This is a web component (`LitElement`) that statically creates a `Workspace` and a `Page` and adds a `EditorContainer` to itself. The `EditorContainer` is the main component of the editor, which is responsible for rendering the page and handling user interactions.

By using this approach, you can easily extend the BlockSuite-based editor and control all block content by manipulating the `page` instance. Remember, the data layer API of the editor data is always based simply on **blocks**—you don't need to learn complex concepts like _operations_, _actions_, _commands_, _transforms_! And now, you can undo and redo your changes as you wish, achieving the effect of time travel:

- `page.undo()` undoes a change.
- `page.redo()` redoes a change.
- `page.captureSync()` immediately adds a history record.

Happy hacking!

::: tip
By default, all block operations within a certain period of time are aggregated into a single history record, which is particularly useful for rich-text editing. If you added 10 blocks at once and need to undo each addition separately, you can use `page.captureSync()` before adding each block.
:::
