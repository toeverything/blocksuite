import '@blocksuite/blocks';
import { BlockSchema } from '@blocksuite/editor';
import { Store, DebugProvider, IndexedDBProvider } from '@blocksuite/store';
import './style.css';

// Workaround
const IS_PLAYGROUND = location.href.includes('5173');
const IS_WEB = typeof window !== 'undefined';

const params = new URLSearchParams(location.search);
const room = params.get('room') || 'virgo-default';

window.onload = () => {
  const doc = Store.createDoc();
  const store = new Store({
    doc,
    providers: [
      IS_PLAYGROUND && IS_WEB ? new DebugProvider(room, doc) : undefined,
      new IndexedDBProvider(room, doc),
    ],
    createId: count => {
      return `${Date.now()}-${count}`;
    },
  }).register(BlockSchema);

  const editor = document.createElement('editor-container');
  editor.store = store;

  document.body.appendChild(editor);
};
