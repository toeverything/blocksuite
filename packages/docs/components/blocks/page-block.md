# Page Block

This is the root node of the document tree, and its view implementation becomes the top-level UI of the editor.

For instance, the [doc editor](../editors/doc-editor) and the [edgeless editor](../editors/edgeless-editor) implement two different views for the page block. Generally, content (leaf nodes) is not placed directly in the page block. Its direct children are usually at least one [note block](./note-block) and one optional [surface block](./surface-block). Rich text content like paragraphs and lists are generally placed in the note blocks, while graphical content is placed in the surface block.

![block-nesting](../../images/block-nesting.png)

## Reference

- [`PageBlockSchema`](/api/@blocksuite/blocks/variables/PageBlockSchema.html)
- [`DocPageService`](/api/@blocksuite/blocks/classes/DocPageService.html)
- [`EdgelessPageService`](/api/@blocksuite/blocks/classes/EdgelessPageService.html)
