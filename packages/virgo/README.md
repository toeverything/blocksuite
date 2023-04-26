# `@blocksuite/virgo`

## Introduction

Virgo is a minimized rich-text editing kernel that synchronizes the state between DOM and [Y.Text](https://docs.yjs.dev/api/shared-types/y.text), which differs from other rich-text editing frameworks in that its data model are _natively_ CRDT. For example, to support collaborative editing in Slate.js, you may need to use a plugin like slate-yjs, a wrapper around [Yjs](https://github.com/yjs/yjs). In these plugins, all text operations should be converted between Yjs and Slate.js operations. This may result in undo/redo properly and hard to maintain the code. However, with Virgo, we can directly synchronize the DOM state between Yjs and DOM, which means that the state in Yjs is the single source of truth. It signify that to update, can just calling the `Y.Text` API to manipulate the DOM state, which could significantly reduces the complexity of the editor.

Initially in BlockSuite, we use [Quill](https://github.com/quilljs/quill) for in-block rich-text editing, which only utilizes a small subset of its APIs. Every paragraph in BlockSuite is managed in a standalone Quill instance, which is attached to a `Y.Text` instance for collaborative editing. Virgo makes this further simpler, since what it needs to do is the same as how we use the Quill subset. It just needs to provide a flat rich-text synchronization mechanism, since the block-tree-level state management is handled by the data store in BlockSuite.

A virgo editor state corresponds to `Y.Text`, it's easy to convert between them. Virgo also provides a `Delta` format to represent the editor state, which is also supported by Yjs. So we can use Yjs to manipulate all the states of the text including format.

```ts
const yText = new Y.Text();

// Bind Y.Text to virgo editor, then type 'aaa\nbbb'
// ...
console.log(yText.toString()); // 'aaa\nbbb'

console.log(yText.toDelta());
/*
[
  {
    insert: 'aaa\nbbb',
  },
];
*/
```

If you format from the first character to the second character, the string representation in `Y.Text` will still be `aaa\nbbb`. But if we covert it to Delta, you will see the difference:

```ts
// Continue the example before, format 'aa' to bold
// ...
console.log(yText.toString()); // 'aaa\nbbb'

console.log(yText.toDelta());
/*
[
  {
    insert: 'aa',
    attributes: {
      bold: true,
    },
  },
  {
    insert: 'a\nbbb',
  },
];
*/
```

You will see that there is a `type` attribute in the Delta format, which is used to represent the type of text segments, like base text (bold, italic, line-break, inline-code, link, etc.). This format makes it easy implementing customized inline elements.

## Usage

To use Virgo in your project, all you need to do is to create a `Y.Text` instance from `Y.Doc`, bind it to the virgo editor, then mount it to the DOM:

```ts
import * as Y from 'yjs';
import { VEditor } from '@blocksuite/virgo';

const doc = new Y.Doc();
const yText = doc.getText('text');
const vEditor = new VEditor(yText);

const editorContainer = document.getElementById('editor');
vEditor.mount(editorContainer);
```

You can go to [virgo playground](https://blocksuite-toeverything.vercel.app/examples/virgo/)
for online testing and check out the code in its [repository](https://github.com/toeverything/blocksuite/tree/master/packages/playground/examples/virgo).

> 🚧 The documentation about customizing inline elements and detailed APIs are still in progress. Stay tuned!
