# Block Spec APIs

In BlockSuite, blocks should be defined with certain kinds of shapes. Each shape is called a "block spec".
The _spec_ means "specification", which includes a set of interfaces for defining blocks.

A block spec contains the following properties:

- `schema`: The schema of the block. It represents the data structure of the block.
- `service`: The service of the block. It represents the global business logic of the block.
- `view`: The view of the block. It represents the UI of the block.
  - `component`: The component of the block. It represents the UI component of the block.
  - `widgets`: The widgets of the block. It represents the UI widgets of the block.

## Lit-Based Example

Note that in block spec, the definition of `view` is related to UI frameworks. By default, we provide a `@blocksuite/lit` package to help build a lit block view. But it's still possible to use other UI frameworks. We'll introduce later about how to write custom block renderers.

Here is a example of a lit-based block spec:

```ts
import type { BlockSpec } from '@blocksuite/block-std';
import { literal } from 'lit/static-html.js';

const myBlock: BlockSpec = {
  schema: MyBlockSchema,
  service: MyBlockService,
  view: {
    component: literal`my-block-component`,
    widgets: {
      myBlockToolbar: literal`my-block-toolbar`,
      myBlockMenu: literal`my-block-menu`,
    },
  },
};
```

We'll introduce each part of the block spec in the following sections.
