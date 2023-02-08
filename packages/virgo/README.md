# `@blocksuite/virgo`

Virgo is a mini-editor kernel for direct state synchronisation between dom and Y.Text,
which differs from other rich text frameworks on the market in that its data structures
are natively supported by CRDTs. For example, if we want to support collaborative editing
in Slate.js, we need to use a plugin like slate-yjs, which is a wrapper around Yjs. In
these plugins, all text operations are converted to Yjs operations, which are then
converted back to Slate.js operations. This usually results in some bugs like undo/redo
not working properly and hard to maintain the code. However, with Virgo, we can
directly use Yjs to synchronise the state of the dom, which means that the state in Yjs
is the single source of truth. This also means that we can just use the Yjs API to
manipulate the state of the dom, which significantly reduces the complexity of the code.
That's why we created Virgo and the difference between Virgo and other rich text editors
like Quill, Slate, Lexical, ProseMirror, etc.

In blocksuite editor we use Quill to manipulate the dom now but we just use a small part of
its API. Every line in blocksuite is a single Quill editor, and bind it to a Y.Text for
collaborative editing. As I said before, it causes some problems so we plan to replace
Quill with Virgo. What Virgo needs to do is the same as Quill so it just need to provide a
line-level state synchronisation mechanism because block-level state synchronisation is
handled by other modules in blocksuite. That's why virgo just has limited support
for block-level text control.

A virgo editor state corresponds to a string in Y.Text, it is easy to convert between
them. Virgo also provides a Delta format to represent the state of the editor, which is
also supported by Yjs. So we can use Yjs to manipulate all the states of the text including
format.

```js
const yText = new Y.Text();
// bind yText to virgo editor, type 'aaa' and press enter and type 'bbb' //
console.log(yText.toString());
// 'aaa\nbbb'
console.log(yText.toDelta());
// [
//     {
//         "insert": "aaa",
//         "attributes": {
//             "type": "base"
//         }
//     },
//     {
//         "insert": "\n",
//         "attributes": {
//             "type": "line-break"
//         }
//     },
//     {
//         "insert": "bbb",
//         "attributes": {
//             "type": "base"
//         }
//     }
// ]
```

If you format from the first character to the second character, the string in Y.Text
value will still be 'aaa\nbbb' but if we covert it to Deltas you will see the difference.

```js
// continue before example, format 'aa' to bold //
console.log(yText.toString());
// 'aaa\nbbb'
console.log(yText.toDelta());
// [
//     {
//         "insert": "aa",
//         "attributes": {
//             "type": "base",
//             "bold": true
//         }
//     },
//     {
//         "insert": "a",
//         "attributes": {
//             "type": "base"
//         }
//     },
//     {
//         "insert": "\n",
//         "attributes": {
//             "type": "line-break"
//         }
//     },
//     {
//         "insert": "bbb",
//         "attributes": {
//             "type": "base"
//         }
//     }
// ]
```

You will see that there are a type attribute in the Delta format, which is used to
represent the type of the text like base text (bold, italic, etc.), line-break,
inlie-code, link, etc. This attribute is used to make developers easy to implement
customed inline element.

## Documentation

If you want to use Virgo in your project for controlling the state of the dom, all
you need to do is to create a Y.Text from Y.Doc, bind it to the virgo editor and
mount it to the dom. Virgo will automatically synchronise the state of the dom
including text content, format, cursor position, etc.

```js
const yDoc = new Y.Doc();
const yText = yDoc.getText('text');
const virgo = new Virgo(yText);

const editorContainer = document.getElementById('editor');
virgo.mount(editorContainer);
```

You can go to [virgo playground](https://blocksuite-toeverything.vercel.app/examples/virgo/)
to test it and see the code in [repository](https://github.com/toeverything/blocksuite/tree/master/packages/playground/examples/virgo).

> 🚧 How to implement customed inline element and complete API documentation is still
> in progress.
