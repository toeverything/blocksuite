import '@blocksuite/blocks';
import '@blocksuite/editor';
import { BlockSchema } from '@blocksuite/editor/src/block-loader';
import { Store, StoreOptions } from '@blocksuite/store';
import {
  DebugProvider,
  ProviderFactory,
} from '@blocksuite/store/src/providers';
import './style.css';

type EditorOptions =
  | {
      store: Store;
    }
  | Partial<StoreOptions>;

const params = new URLSearchParams(location.search);
const room = params.get('room') ?? undefined;

const createEditor = (options: EditorOptions = {}) => {
  const editor = document.createElement('editor-container');

  if ('store' in options) {
    // 1. Use custom store
    editor.store = options.store;
    return editor;
  }
  if (Object.keys(options).length > 0) {
    // 2. Use custom room or providers
    const store: Store = new Store({
      room: options.room,
      providers: options.providers,
      awareness: options.awareness,
    }).register(BlockSchema);
    editor.store = store;
    return editor;
  }
  // 3. Use default store
  return editor;
};

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
