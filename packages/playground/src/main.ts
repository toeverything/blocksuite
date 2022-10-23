import '@blocksuite/blocks';
import '@blocksuite/editor';
import { createEditor } from '@blocksuite/editor';
import { DebugProvider } from '@blocksuite/store/src/providers';
import './style.css';

const params = new URLSearchParams(location.search);
const room = params.get('room') ?? undefined;

window.onload = () => {
  const editor = createEditor({
    room,
    providers: [DebugProvider],
  });
  document.body.appendChild(editor);

  // const store = editor.store;
  // const pageId = store.addBlock({
  //   flavour: 'page',
  //   title: `BlockSuite live demo`,
  // });
  // const groupId = store.addBlock({ flavour: 'group' }, pageId);

  // const text = new Text(store, 'Legend from here...');
  // text?.format(6, 6, { link: 'http://localhost:5174/' });
  // store.addBlock({ flavour: 'paragraph', text }, groupId);
};
