# Doc Editor

This editor component is designed for typical flow content editing, offering functionalities aligned with rich text editors based on the frameworks like ProseMirror or Slate.

## Features

TODO

## Usage

```ts
import { DocEditor } from '@blocksuite/presets';

const editor = new DocEditor();
```

Assigning a [`page`](../../guide/working-with-block-tree#block-tree-basics) object to `editor.page` will attach a block tree to the editor, and [`editor.host`](../../guide/working-with-block-tree#block-tree-in-editor) contains the API surface for editing. The [quick start](../../guide/quick-start) guide also serves as an online playground.

<iframe src="https://try-blocksuite.vercel.app/starter/?init" frameborder="no" width="100%" height="500"></iframe>

## Customization

TODO

## Reference

TODO
