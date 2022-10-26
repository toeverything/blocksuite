import '@blocksuite/blocks';
import '@blocksuite/editor';
import { createEditor } from '@blocksuite/editor';
import { DebugProvider } from '@blocksuite/store';
import './style.css';

const params = new URLSearchParams(location.search);
const room = params.get('room') ?? '';

window.onload = () => {
  const editor = createEditor({
    room,
    providers: [DebugProvider],
  });
  document.body.appendChild(editor);
};
