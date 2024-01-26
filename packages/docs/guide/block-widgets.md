# Block Widgets

In BlockSuite, widgets are components that can be used to display helper UI elements of a block. Sometimes, you want to display a menu to provide some extra information or actions for a block. As another example, it's a common practice to display a toolbar when you select a block.

The widget is designed to provide this kind of functionalities. Similar to blocks, widgets also depends on UI frameworks. By default, we provide a [lit](https://lit.dev/) renderer called `@blocksuite/lit`. But it's still possible to use other UI frameworks. We'll introduce later about how to write custom block renderers.

## Lit Widget View

We provide a `WidgetElement` class to help build a lit widget view.

```ts
import { WidgetElement } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElements('my-widget')
class MyWidgetView extends WidgetElement<MyBlockView> {
  override render() {
    return html`
      <div>
        <h3>My Widget</h3>
      </div>
    `;
  }
}
```

## Get Host Block

Widget is always related to a block called host block.
And we can get the host block by using `blockElement` property.

For example, if you have a `code block` for displaying code examples, and you want to display a `language picker` widget to let users change the language of the code block. The widget could be defined in this manner:

```ts
import { WidgetElement } from '@blocksuite/lit';
import { html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElements('my-widget')
class CodeLanguagePicker extends WidgetElement<CodeBlockElement> {
  private _onChange = e => {
    this.page.updateBlock(this.blockElement.model, {
      language: e.target.value,
    });
  };

  override render() {
    return html`
      <select @change=${this._onChange}>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
      </select>
    `;
  }
}
```

You can get the `std` instance from `this.std` to use the full power of [`block-std`](/api/@blocksuite/block-std/).
