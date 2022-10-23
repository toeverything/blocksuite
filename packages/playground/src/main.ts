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
};
