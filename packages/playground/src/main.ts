import '@blocksuite/blocks';
import '@blocksuite/editor';
import { BlockSchema, createDebugMenu, createEditor } from '@blocksuite/editor';
import { Generator, Page, Workspace } from '@blocksuite/store';
import { getOptions } from './utils';
import './style.css';

const params = new URLSearchParams(location.search);
const init = params.get('init');
const isE2E = params.get('room')?.includes('playwright');

const initButton = <HTMLButtonElement>document.getElementById('init-btn');
const options = getOptions();

// Subscribe for page update and create editor after page loaded.
function subscribePage(workspace: Workspace) {
  workspace.signals.pageAdded.once(pageId => {
    const page = workspace.getPage(pageId) as Page;
    const editor = createEditor(page);
    const debugMenu = createDebugMenu(workspace, editor);
    document.body.appendChild(editor);
    document.body.appendChild(debugMenu);
    initButton.disabled = true;

    // @ts-ignore
    [window.editor, window.page] = [editor, page];
  });
}

async function main() {
  if (isE2E) {
    // We need a predictable id generator in test environment.
    // Keep in mind that the collaboration will cause playground crash,
    //  because all clients' id starting at 0.
    options.idGenerator = Generator.AutoIncrement;
  }
  const workspace = new Workspace(options).register(BlockSchema);
  // @ts-ignore
  [window.workspace, window.blockSchema] = [workspace, BlockSchema];

  // In E2E environment, initial state should be generated by test case,
  // instead of using this default setup.
  if (isE2E) return;

  subscribePage(workspace);

  const initFunctions = (await import('./data')) as Record<
    string,
    (workspace: Workspace) => void
  >;
  initButton.addEventListener('click', () => initFunctions.basic(workspace));

  if (init != null) {
    if (initFunctions[init]) {
      initFunctions[init]?.(workspace);
    } else {
      workspace.fromBase64Update(init);
    }
  }
}

main();
