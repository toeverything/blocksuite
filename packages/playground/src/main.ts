import '@blocksuite/blocks';
import '@blocksuite/editor';
import std from '@blocksuite/blocks/std';
import Models from '@blocksuite/blocks/models';
const { BlockSchema } = Models;
/** Uncomment this line if you are using BlockSuite in your own project */
// import "@blocksuite/blocks/style";
import { DebugMenu, EditorContainer } from '@blocksuite/editor';
import { Page, Workspace, Utils } from '@blocksuite/store';
import { getOptions, initParam, isBase64, isE2E } from './utils';
import './style.css';

const initButton = <HTMLButtonElement>document.getElementById('init-btn');
const options = getOptions();

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
    document.body.appendChild(debugMenu);

    initButton.disabled = true;

    // @ts-ignore
    [window.editor, window.page] = [editor, page];
  });
}

async function main() {
  const workspace = new Workspace(options).register(BlockSchema);
  // @ts-ignore
  [window.workspace, window.blockSchema] = [workspace, BlockSchema];
  // @ts-ignore
  [window.Y, window.std] = [Workspace.Y, std];

  // In E2E environment, initial state should be generated by test case,
  // instead of using this default setup.
  if (isE2E) return;

  subscribePage(workspace);

  const initFunctions = (await import('./data')) as Record<
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
