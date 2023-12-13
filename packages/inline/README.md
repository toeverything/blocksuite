# `@blocksuite/inline`

Inline rich text editing component for BlockSuite.

Usage:

```ts
import * as Y from 'yjs';
import { InlineEditor } from '@blocksuite/inline';

const doc = new Y.Doc();
const yText = doc.getText('text');
const inlineEditor = new InlineEditor(yText);

const myEditor = document.getElementById('my-editor');
inlineEditor.mount(myEditor);
```

You can go to [inline editor playground](https://try-blocksuite.vercel.app/examples/inline/)
for online testing and check out the code in its [repository](https://github.com/toeverything/blocksuite/tree/master/packages/playground/examples/inline).

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

The inline editor use zod to validate attributes, you can use `setAttributesSchema` to set the schema:

```ts
// you don't have to extend baseTextAttributes
const customSchema = baseTextAttributes.extend({
  reference: z
    .object({
      type: type: z.enum([
        // @deprecated Subpage is deprecated, use LinkedPage instead
        'Subpage',
        'LinkedPage',
      ]),
      pageId: z.string(),
    })
    .optional()
    .nullable()
    .catch(undefined),
  background: z.string().optional().nullable().catch(undefined),
  color: z.string().optional().nullable().catch(undefined),
});

const doc = new Y.Doc();
const yText = doc.getText('text');
const inlineEditor = new InlineEditor(yText);
inlineEditor.setAttributesSchema(customSchema);

const editorContainer = document.getElementById('editor');
inlineEditor.mount(editorContainer);
```

`InlineEditor` has default attributes schema, so you can skip this step if you think it is enough.

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

`InlineEditor` use this function to render text with custom format and it is also the way to customize the text render.

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
const inlineEditor = new InlineEditor(yText);
inlineEditor.setAttributeRenderer(attributeRenderer);

const editorContainer = document.getElementById('editor');
inlineEditor.mount(editorContainer);
```

You will see there is a `v-text` in the template, it is a custom element that render text node. `InlineEditor` use them to calculate range so you have to use them to render text content from delta.

### Rich Text

If you find the `InlineEditor` features may be limited or a bit verbose to use, you can refer to or directly use the [rich-text](https://github.com/toeverything/blocksuite/blob/f71df00ce18e3f300caad914aaedf63267158885/packages/blocks/src/components/rich-text/rich-text.ts) encapsulated in the `blocks` package. It contains basic editing features like copy/cut/paste, undo/redo (including range restore).
