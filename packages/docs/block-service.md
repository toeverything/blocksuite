# Block Service

::: info
This document is preliminary and subject to refinement and updates for clarity and accuracy.
:::

Each kind of block can register its own service, so as to define block-specific methods to be called during the editor lifecycle. The service is a class that extends the `BlockService` class:

```ts
import { BlockService } from '@blocksuite/block-std';
import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';

const myBlockSchema = defineBlockSchema({
  //...
});

type MyBlockModel = SchemaToModel<typeof myBlockSchema>;

class MyBlockService extends BlockService<MyBlockModel> {
  //...
}
```

For each block type, its service will only be instantiated once. And even though there is no block instance, the service will still be instantiated. So it's designed for defining editor-level methods for certain kind of block.

For example, if you want to bind certain hotkey for creating a new block, you can do it in the service:

```ts
class MyBlockService extends BlockService<MyBlockModel> {
  override mounted() {
    super.mounted();
    this.bindHotkey(
      {
        'Alt-1': this._addMyBlock,
      },
      { global: true }
    );
  }

  private _addMyBlock = () => {
    this.page.addBlock('my-block', {});
  };
}
```

## Lifecycle Hooks

The `BlockService` class provides some lifecycle hooks for you to override.

- `mounted`: This hook will be called when the service is instantiated.
- `unmounted`: This hook will be called when the service is destroyed.
