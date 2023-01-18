/// <reference types="./env" />
import '@blocksuite/blocks';
import '@blocksuite/editor';
import std from '@blocksuite/blocks/std';
import { BlockSchema } from '@blocksuite/blocks/models';
import { EditorContainer } from '@blocksuite/editor';
import { Page, Workspace, Utils } from '@blocksuite/store';
import { DebugMenu } from './components/debug-menu.js';
import {
  defaultMode,
  getOptions,
  initDebugConfig,
  initParam,
  isBase64,
  isE2E,
} from './utils.js';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import './style.css';

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

async function main() {
  const workspace = new Workspace(options).register(BlockSchema);
  [window.workspace, window.blockSchema] = [workspace, BlockSchema];
  [window.Y, window.std] = [Workspace.Y, std];

  // In E2E environment, initial state should be generated by test case,
  // instead of using this default setup.
  if (isE2E) return;

  subscribePage(workspace);

  const initFunctions = (await import('./data/index.js')) as Record<
    string,
    (workspace: Workspace) => void
  >;
  initButton.addEventListener('click', () => initFunctions.basic(workspace));

  if (initParam != null) {
    if (initFunctions[initParam]) {
      initFunctions[initParam]?.(workspace);
    } else {
      if (initParam !== '' && isBase64.test(initParam)) {
        Utils.applyYjsUpdateV2(workspace, initParam);
      } else {
        // fallback
        initFunctions.basic(workspace);
      }
    }
  }
}

main();
