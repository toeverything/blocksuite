import '@blocksuite/blocks';
import { BlockSchema } from '@blocksuite/editor';
import { Store, DebugProvider } from '@blocksuite/store';
import './style.css';

const params = new URLSearchParams(location.search);
const room = params.get('room') || 'virgo-default';

window.onload = () => {
  const store = new Store({
    room,
    providers: [DebugProvider],
  }).register(BlockSchema);

  const editor = document.createElement('editor-container');
  editor.store = store;

  document.body.appendChild(editor);
};
