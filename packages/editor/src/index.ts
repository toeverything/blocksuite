import { Store, StoreOptions } from '@blocksuite/store';
import { BlockSchema } from './block-loader';

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

export const createEditor = (options: EditorOptions = {}) => {
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
