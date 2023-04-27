# Handling Events

BlockSuite constructs a block tree using `Workspace`, `Page`, and `Block`, which can be used for framework agnostic state management. Once the block tree nodes are bound to a framework, the block content can be rendered. It is also necessary to subscribe to corresponding events when blocks are updated, in order to refresh the UI framework on demand.

::: info
Note that applications based on BlockSuite may not require virtual DOM, since the block tree can precisely trigger events when a single block is updated. Refer to [Unidirectional Data Flow](./unidirectional-data-flow) for the underlying principles behind this design.
:::

## Using Slots

BlockSuite extensively uses `Slot` to manage events. You can think of it as a type-safe event emitter or a simplified RxJS [Observable](https://rxjs.dev/guide/observable):

```ts
import { Slot } from '@blocksuite/store';

// Create a new slot
const slot = new Slot<{ name: string }>();

// Subscribe events
slot.on(({ name }) => console.log(name));

// Or alternatively only listen event once
slot.once(({ name }) => console.log(name));

// Emit the event
slot.emit({ name: 'foo' });
```

To unsubscribe from the slot, simply use the return value of `slot.on()`:

```ts
const slot = new Slot();
const disposable = slot.on(myHandler);

// Dispose the subscription
disposable.dispose();
```

## Subscribing Block Events

Under the `page` instance, you can subscribe to common events using `page.slots`:

```ts
page.slots.rootAdded.on(() => {
  // The `page.root` is not null at this point
  // You can bind it to a component tree now
  console.log('rootAdded!');
});

page.addBlock('affine:page'); // rootAdded!
```

Moreover, for any node in the block tree, events can be triggered when the node is updated:

```ts
const model = page.root[0];

// Triggered when the `props` of the block model is updated
model.propsUpdated.on(() => updateMyComponent());
// Triggered when the `children` of the block model is updated
model.childrenUpdated.on(() => updateMyComponent());
```

In the prebuilt AFFiNE editor, which is based on the [Lit](https://lit.dev/) framework, the UI component of each block subscribes to its model updates using this pattern.

So far, the information we've covered should be sufficient for you to use `@blocksuite/store` to construct basic collaborative application state. For rich-text content editing involving more intricate operations, we will continue to cover it in subsequent sections of the document.
