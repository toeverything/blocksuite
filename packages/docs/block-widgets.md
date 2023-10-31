# Block Widgets

Widgets are components that can be used to display helper UI elements of a block.

Sometimes, you want to display a menu to provide some extra information or actions for a block.
For example, it's a common practice to display a toolbar when you select a block.

The widget is designed to provide this kind of functionality.
Similar to block, widget is also related to UI framework.
By default, we provide a [lit](https://lit.dev/) renderer called `@blocksuite/lit`.
But it's still possible to use other UI frameworks. We'll introduce later about how to write a custom renderer in [custom renderer](/#WIP).

## Lit Widget View

We provide a `WidgetElement` class to help build a lit widget view.

```typescript
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

For example, if we have a `code block` which can display some code examples,
and we want to display a `language picker` widget to let users change the language of the code block.

```typescript
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

You can get the `std` instance from `this.std` to use the full power of [std](/block-std-overview).
