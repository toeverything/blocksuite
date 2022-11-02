import { Store, StoreOptions } from '@blocksuite/store';
import { BlockSchema } from './block-loader';
import type { EditorContainer } from './components';

export * from './components';
export * from './managers';

const env =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
    : {};
const importIdentifier = '__ $BLOCKSUITE_EDITOR$ __';

// @ts-ignore
if (env[importIdentifier] === true) {
  // https://github.com/yjs/yjs/issues/438
  console.error(
    '@blocksuite/editor was already imported. This breaks constructor checks and will lead to issues!'
  );
}
// @ts-ignore
env[importIdentifier] = true;

// TODO support custom BlockSchema
export type EditorOptions =
  | {
      store: Store;
    }
  | Partial<StoreOptions>;

/**
 * @internal
 */
export const parseEditorOptions = (options: EditorOptions = {}) => {
  if ('store' in options) {
    // 1. Use custom store
    return { store: options.store };
  }
  if (Object.keys(options).length > 0) {
    // 2. Use custom room or providers
    const store = new Store({
      room: options.room,
      providers: options.providers,
      awareness: options.awareness,
    });
    store.space.register(BlockSchema);
    return { store };
  }
  // 3. Use default store
  const store = new Store();
  store.space.register(BlockSchema);
  return { store };
};

export const createEditor = (options: EditorOptions = {}): EditorContainer => {
  const editor = document.createElement('editor-container');
  const { store } = parseEditorOptions(options);
  editor.store = store;
  return editor;
};
