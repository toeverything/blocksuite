# Modeling Editor State

The editor state represents the core data structure of the editor. It contains the document, selection, and any other state relevant to the editor. It can only be updated by applying transactions. You can think of it as a snapshot of the editor at a given point in time. We can always restore the editor to a previous state.

There are mainly three parts of the editor state:

- Document
- Awareness
- 🚧 Context

## Document

Document contains the block tree structure in the editor. In BlockSuite, the block tree is constructed as map of block ID to block model under the hood.

When collaborating with other users, the document will be synchronized with other users.

This is an example of a typical block model:

```ts
type BlockModel = {
  // These three fields are required for a block tree node,
  // so they are known as "system" props
  id: string;
  flavour: string;
  children: BlockModel[];

  // Custom properties that are different for different block flavours
  text: Text;
  listType: 'bullet' | 'number';
  titleLevel: number;
};
```

When the document is updated, the corresponding [slot](./event-api#using-slots) events will be triggered, and the UI components of the blocks should be updated accordingly.

## Awareness

Awareness contains multiple client-wise state instances related to one certain document. They are transient and would not be persisted into the block tree.

When interacting with the editor, we want some part of the information to be shared with other users, but the information should be different for different users.

For example:

- Username - we want to show the username of each collaborator in the editor.
- Cursor - we want to show the cursor of each collaborator in the editor, but we don't want to let them influence our editing history.

When collaborating with other users, the local editor will receive the awareness information of all other users. These awareness information should be displayed in UI, but they should not affect local editing against the document.

## 🚧 Context

WIP
