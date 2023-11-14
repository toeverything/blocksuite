# Quick Start

The `@blocksuite/editor` package contains the editor built into AFFiNE. Its `nightly` versions are released daily based on the master branch, and they are always tested on CI. This means that the `nightly` versions can already be used in real-world projects like AFFiNE at any time:

```sh
pnpm i @blocksuite/editor@nightly
```

If you want to easily reuse most of the rich-text editing features, you can use the `SimpleAffineEditor` web component directly ([code example here](https://github.com/toeverything/blocksuite/blob/master/packages/playground/examples/basic/index.html)):

::: code-sandbox {template=vanilla-ts coderHeight=180 previewHeight=500}

```ts /index.ts
import { SimpleAffineEditor } from '@blocksuite/editor';
import '@blocksuite/editor/themes/affine.css';

const editor = new SimpleAffineEditor();
document.body.appendChild(editor);
```

:::

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

However, the `SimpleAffineEditor` here is just a [thin wrapper with dozens of lines](https://github.com/toeverything/blocksuite/blob/master/packages/editor/src/components/simple-affine-editor.ts) that doesn't enable the opt-in collaboration and [data persistence](./data-persistence) features. If you are going to support more complicated real-world use cases (e.g., with customized block models and configured data sources), this would involve the use of more packages. In the following chapters, we will continue to demonstrate their usage and the core concepts involved.
