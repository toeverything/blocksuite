/// <reference types="./env" />
import '@blocksuite/blocks';
import '@blocksuite/editor';
import std from '@blocksuite/blocks/std';
import { EditorContainer } from '@blocksuite/editor';
import { Page, Workspace } from '@blocksuite/store';
import { DebugMenu } from './components/debug-menu.js';
import {
  defaultMode,
  getOptions,
  tryInitExternalContent,
  initDebugConfig,
  initParam,
  isE2E,
} from './utils.js';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/editor/themes/affine.css';
import { builtInSchemas, __unstableSchemas } from '@blocksuite/blocks/models';

const initButton = <HTMLButtonElement>document.getElementById('init-btn');
const options = getOptions();
initDebugConfig();

// Subscribe for page update and create editor after page loaded.
function subscribePage(workspace: Workspace) {
  workspace.signals.pageAdded.once(pageId => {
    const page = workspace.getPage(pageId) as Page;

    const editor = new EditorContainer();
    editor.page = page;
    document.body.appendChild(editor);

    const debugMenu = new DebugMenu();
    debugMenu.workspace = workspace;
    debugMenu.editor = editor;
    debugMenu.mode = defaultMode;
    document.body.appendChild(debugMenu);

    initButton.disabled = true;

    [window.editor, window.page] = [editor, page];
  });
}

async function initPageContentByParam(workspace: Workspace) {
  const initFunctions = (await import('./data/index.js')) as Record<
    string,
    (workspace: Workspace) => Promise<string>
  >;

  initButton.addEventListener('click', () => initFunctions.preset(workspace));

  // No `?init` param provided
  if (initParam === null) return;

  // Load the preset playground documentation when `?init` param provided
  if (initParam === '') {
    await initFunctions.preset(workspace);
    return;
  }

  // Load built-in init function when `?init=heavy` param provided
  if (initFunctions[initParam]) {
    await initFunctions[initParam]?.(workspace);
    return;
  }

  // Try to load base64 content or markdown content from url
  await tryInitExternalContent(workspace, initParam);
}

async function main() {
  const workspace = new Workspace(options)
    .register(builtInSchemas)
    .register(__unstableSchemas);
  [window.workspace, window.blockSchemas] = [workspace, builtInSchemas];
  [window.Y, window.std] = [Workspace.Y, std];

  // In E2E environment, initial state should be generated by test case,
  // instead of using this default setup.
  if (isE2E) return;

  subscribePage(workspace);

  await initPageContentByParam(workspace);
}

main();
