import type { Space, Store } from '@blocksuite/store';
import type { EditorContainer } from './components';

export * from './components';
export * from './managers';
export * from './block-loader';
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

export const createEditor = (space: Space): EditorContainer => {
  const editor = document.createElement('editor-container');
  editor.space = space;
  return editor;
};

export const createDebugMenu = (store: Store, editor: EditorContainer) => {
  const debugMenu = document.createElement('debug-menu');
  debugMenu.store = store;
  debugMenu.editor = editor;
  return debugMenu;
};
