import type { Page, Workspace } from '@blocksuite/store';
import type { EditorContainer } from './components/index.js';

export * from './components/index.js';
export * from './managers/index.js';
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

export function createEditor(page: Page): EditorContainer {
  const editor = document.createElement('editor-container');
  editor.page = page;
  return editor;
}

export function createDebugMenu(workspace: Workspace, editor: EditorContainer) {
  const debugMenu = document.createElement('debug-menu');
  debugMenu.workspace = workspace;
  debugMenu.editor = editor;
  return debugMenu;
}
