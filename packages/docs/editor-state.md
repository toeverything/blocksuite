# Editor State

The Editor State is the core data structure of the editor.
It contains the document, selection, and any other state relevant to the editor.
It is immutable, and can only be updated by applying transactions.
You can think of it as a snapshot of the editor at a given point in time.
We can always restore the editor to a previous state.

There are mainly three parts of the editor state:

- Document
- Awareness
- 🚧 Context

## Document

Document contains the block tree structure of the editor.
It is a map of block ID to block model.

When collaborating with other users, the document will be synchronized with other users.
And the document

Generally, a block model contains the following information:

```ts
type BlockModel = {
  // system information
  id: string;
  flavour: string;
  children: BlockModel[];

  // properties, will be different for different flavours
  text: Text;
  listType: 'bullet' | 'number';
  titleLevel: number;
};
```

When document is updated, the corresponding slot events will be triggered.
And the blocks should update the UI components accordingly.

## Awareness

Awareness contains the information of each user in the editor.

When interacting with the editor, we want some part of the information to be shared with other users,
but the information should be different for different users.

For example:

- Username: We want to show the username of each collaborator in the editor.
- Selection: We want to show the cursor of each collaborator in the editor.
  But we don't want to let them influence our editing.

When collaborating with other users, the local editor will receive the awareness information of other users.
The information should be displayed in the UI. But it should not affect the local editing.

## 🚧 Context

WIP
