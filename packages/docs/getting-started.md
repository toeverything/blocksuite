# Getting Started

The `@blocksuite/editor` package contains the editor built into AFFiNE. Its `nightly` versions are released daily based on the master branch, and they are always tested on CI. This means that the `nightly` versions can already be used in real-world projects like AFFiNE at any time:

```sh
pnpm i @blocksuite/editor@nightly
```

If you want to easily reuse most of the rich-text editing features, you can use the `SimpleAffineEditor` web component directly ([code example here](https://github.com/toeverything/blocksuite/blob/master/packages/playground/examples/basic/index.html)):

```ts
import { SimpleAffineEditor } from '@blocksuite/editor';
import '@blocksuite/editor/themes/affine.css';

const editor = new SimpleAffineEditor();
document.body.appendChild(editor);
```

<div id="editor-example" style="height: 250px; border: 1px solid grey; padding: 50px;"></div>

<script>
import '@blocksuite/editor/themes/affine.css';

async function main() {
  const { SimpleAffineEditor } = await import('@blocksuite/editor');
  const container = document.getElementById('editor-example');
  const editor = new SimpleAffineEditor();
  container.appendChild(editor);
}

if (typeof window !== 'undefined') {
  main();
}
</script>

Or equivalently, you can also use the declarative style:

```html
<body>
  <simple-affine-editor></simple-affine-editor>
  <script type="module">
    import '@blocksuite/editor';
    import '@blocksuite/editor/themes/affine.css';
  </script>
</body>
```

However, the `SimpleAffineEditor` here is just a [thin wrapper with dozens of lines](https://github.com/toeverything/blocksuite/blob/master/packages/editor/src/components/simple-affine-editor.ts) that doesn't enable the opt-in collaboration and [data persistence](./data-persistence) features. If you are going to support more complicated real-world use cases (e.g., with customized block models and configured data sources), this will involve the use of these three following core packages:

- The `packages/store` package is a data store built for general-purpose state management.
- The `packages/blocks` package holds the default BlockSuite editable blocks.
- The `packages/editor` package ships a complete BlockSuite-based editor.

```sh
pnpm i \
  @blocksuite/store@nightly \
  @blocksuite/blocks@nightly \
  @blocksuite/editor@nightly
```

In the following chapters, we will continue to demonstrate their usage and the core concepts involved.
