# `@blocksuite/virgo`

## Introduction

Virgo is a streamlined rich-text editing core that seamlessly synchronizes the state between DOM and [Y.Text](https://docs.yjs.dev/api/shared-types/y.text). What sets it apart from other rich-text editing frameworks is its natively CRDT data model. For comparison, if you want collaborative editing in Slate.js, you'd typically use a plugin like slate-yjs, which acts as a bridge between [Yjs](https://github.com/yjs/yjs) and Slate.js. Within these plugins, all text operations must be translated between Yjs and Slate.js operations, potentially complicating undo/redo functionalities and code maintenance. With Virgo, the synchronization between Yjs and DOM is direct. This means Yjs's state is the singular source of truth, allowing for direct manipulation of the DOM state via the `Y.Text` API, which considerably reduces the editor's complexity.

In BlockSuite, we initially employed Quill for in-block rich-text editing, leveraging only a limited subset of its APIs. Each paragraph in BlockSuite was managed by an individual Quill instance, linked to a `Y.Text` instance for collaborative purposes. Virgo further simplifies this, performing the same function as our usage of the Quill subset. It essentially offers a straightforward rich-text synchronization process, with block-tree-level state management being taken care of by BlockSuite's data store.

The Virgo editor's state is compatible with `Y.Text`, simplifying the conversion between them. Virgo uses the Delta format, similar to Yjs, allowing Yjs to manage all text states, including formatting.

## Usage

To use Virgo in your project, all you need to do is to create a `Y.Text` instance from `Y.Doc`, bind it to the virgo editor, then mount it to the DOM:

```ts
const doc = new Y.Doc();
const yText = doc.getText('text');
const vEditor = new VEditor(yText);

const editorContainer = document.getElementById('editor');
vEditor.mount(editorContainer);
```

You can go to [virgo playground](https://blocksuite-toeverything.vercel.app/examples/virgo/)
for online testing and check out the code in its [repository](https://github.com/toeverything/blocksuite/tree/master/packages/playground/examples/virgo).

### Attributes

Attributes is a property of a delta structure, which is used to store formatting information.
A delta expressing a bold text node would look like this:

```json
{
  "insert": "Hello World",
  "attributes": {
    "bold": true
  }
}
```

Virgo use zod to validate attributes, you can use `setAttributesSchema` to set the schema:

```ts
// you don't have to extend baseTextAttributes
const customSchema = baseTextAttributes.extend({
  reference: z
    .object({
      type: z.enum(['Subpage', 'LinkedPage']),
      pageId: z.string(),
    })
    .optional()
    .nullable()
    .catch(undefined),
  background: z.string().optional().nullable().catch(undefined),
});

const doc = new Y.Doc();
const yText = doc.getText('text');
const vEditor = new VEditor(yText);
vEditor.setAttributesSchema(customSchema);

const editorContainer = document.getElementById('editor');
vEditor.mount(editorContainer);
```

Virgo has default attributes schema, so you can skip this step if you think it is enough.

```ts
// default attributes schema
const baseTextAttributes = z.object({
  bold: z.literal(true).optional().nullable().catch(undefined),
  italic: z.literal(true).optional().nullable().catch(undefined),
  underline: z.literal(true).optional().nullable().catch(undefined),
  strike: z.literal(true).optional().nullable().catch(undefined),
  code: z.literal(true).optional().nullable().catch(undefined),
  link: z.string().optional().nullable().catch(undefined),
});
```

### Attributes Renderer

Attributes Renderer is a function that takes a delta and returns `TemplateResult<1>`, which is a valid [lit-html](https://github.com/lit/lit/tree/main/packages/lit-html) template result.
Virgo use this function to render text with custom format and it is also the way to customize the text render.

```ts
type AffineTextAttributes = {
  // your custom attributes
};

const attributeRenderer: AttributeRenderer<AffineTextAttributes> = (
  delta,
  // you can use `selected` to check if the text node is selected
  selected
) => {
  // generate style from delta
  return html`<span style=${style}
    ><v-text .str=${delta.insert}></v-text
  ></span>`;
};

const doc = new Y.Doc();
const yText = doc.getText('text');
const vEditor = new VEditor(yText);
vEditor.setAttributeRenderer(attributeRenderer);

const editorContainer = document.getElementById('editor');
vEditor.mount(editorContainer);
```

You will see there is a `v-text` in the template, it is a custom element that render text node.
Virgo use them to calculate range so you have to use them to render text content from delta.

### Rich Text

If you find Virgo's features too limited or difficult to use, you can refer to or directly use the [rich-text](https://github.com/toeverything/blocksuite/blob/f71df00ce18e3f300caad914aaedf63267158885/packages/blocks/src/components/rich-text/rich-text.ts) encapsulated in the blocks package. It contains basic editing features like copy/cut/paste, undo/redo (including range restore).
