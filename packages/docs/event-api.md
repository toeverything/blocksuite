# Event API

BlockSuite constructs a block tree using `Workspace`, `Page`, and `Block`, which can be used for framework agnostic state management. Once the block tree nodes are bound to a framework, the block content can be rendered. It is also necessary to subscribe to corresponding events when blocks are updated, in order to refresh the UI framework on demand.

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
page.slots.ready.on(() => {
  // The `page.root` should be ready to use at this moment
  console.log('page ready!');
});

page.addBlock('affine:page');
```

Moreover, for any node in the block tree, events can be triggered when the node is updated:

```ts
const model = page.root[0];

// Triggered when the `props` of the block model is updated
model.propsUpdated.on(() => updateMyComponent());
// Triggered when the `children` of the block model is updated
model.childrenUpdated.on(() => updateMyComponent());
```

In the prebuilt AFFiNE editor, which is based on the [lit](https://lit.dev/) framework, the UI component of each block subscribes to its model updates using this pattern.

## Event Dispatcher

For UI events, such as `click`. We created a dispatcher to dispatch events.
With the dispatcher, you can handle events in the block view implementation.

```ts
@customElements('my-block')
class MyBlockView extends BlockElement<MyBlockModel> {
  private _handleClick = () => {
    //...
  };

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('click', this._handleClick);
  }
}
```

### Event Bubbling

All events on dispatcher are bound to the root element of the block view to make it possible to bubble events to the parent block view.

```ts
class ChildView extends BlockElement<MyBlockModel> {
  private _handleClick = () => {
    console.log('click1');
  };

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('click', this._handleClick);
  }
}

class ParentView extends BlockElement<MyBlockModel> {
  private _handleClick = () => {
    console.log('click2');
  };

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('click', this._handleClick);
  }
}
```

When you click on the `ChildView`, the console will print:

```
click1
click2
```

You may want to stop the event from bubbling to the parent block view. You can simply return `true` in the event handler:

```ts
class ChildView extends BlockElement<MyBlockModel> {
  private _handleClick = () => {
    console.log('click1');
    return true;
  };

  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('click', this._handleClick);
  }
}
```

Then the console will only print:

```
click1
```

The event bubbling is implemented by event target.
For the events that won't support bubbling,
the event dispatcher will use block path to dispatch events to the parent block views.

### Event Scope

By default, `handleEvents` will only subscribe events triggered by the block view and its children.
We also provide two more scopes to subscribe to make it possible to handle events triggered by other blocks.

#### Flavour Scope

The flavour scope will subscribe to events triggered by the block view and other blocks with the same flavour.

```ts
class MyBlock extends BlockElement<MyBlockModel> {
  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('click', this._handleClick, { flavour: true });
  }
}
```

#### Global Scope

The global scope will subscribe to events triggered by the block view and all other blocks.

```ts
class MyBlock extends BlockElement<MyBlockModel> {
  override connectedCallback() {
    super.connectedCallback();
    this.handleEvent('click', this._handleClick, { global: true });
  }
}
```

## Hotkey

The hotkey is a special event that can be triggered by the keyboard.

Key names may be strings like `"Shift-Ctrl-Enter"`—a key identifier prefixed with zero or more modifiers. Key identifiers
are based on the strings that can appear in [`KeyEvent.key`](https:///developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key).

Use lowercase letters to refer to letter keys (or uppercase letters if you want shift to be held). You may use `"Space"` as an alias for the `" "` name.

Modifiers can be given in any order. `Shift-` (or `s-`), `Alt-` (or `a-`), `Ctrl-` (or `c-` or `Control-`) and `Cmd-` (or `m-` or
`Meta-`) are recognized.
For characters that are created by holding shift, the `Shift-` prefix is implied, and should not be added explicitly.

You can use `Mod-` as a shorthand for `Cmd-` on Mac and `Ctrl-` on other platforms.

```ts
class MyBlock extends BlockElement<MyBlockModel> {
  override connectedCallback() {
    super.connectedCallback();
    this.bindHotkey({
      'Mod-b': () => {},
      'Alt-Space': () => {},
    });
  }
}
```

Same as `handleEvent`, you can return `true` in the hotkey handler to stop the event from bubbling to the parent block view.
