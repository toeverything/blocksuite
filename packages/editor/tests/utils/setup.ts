import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks/models';
import {
  type BlobStorage,
  type DocProviderCreator,
  type Page,
  Workspace,
} from '@blocksuite/store';
import { createMemoryStorage, Generator, Schema } from '@blocksuite/store';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { EditorContainer } from '../../src/index.js';

function createWorkspaceOptions() {
  const providerCreators: DocProviderCreator[] = [];
  const blobStorages: ((id: string) => BlobStorage)[] = [];
  const schema = new Schema();
  const room = Math.random().toString(16).slice(2, 8);

  schema.register(AffineSchemas).register(__unstableSchemas);

  const idGenerator: Generator = Generator.AutoIncrement; // works only in single user mode

  blobStorages.push(createMemoryStorage);

  return {
    id: room,
    schema,
    providerCreators,
    idGenerator,
    blobStorages,
    defaultFlags: {
      enable_transformer_clipboard: true,
      enable_bultin_ledits: true,
      readonly: {
        'page:home': false,
      },
    },
  };
}

async function initWorkspace(workspace: Workspace) {
  const page = workspace.createPage({ id: 'page:home' });

  await page.load(() => {
    const pageBlockId = page.addBlock('affine:page', {
      title: new Text(),
    });
    page.addBlock('affine:surface', {}, pageBlockId);
  });
  page.resetHistory();
}

function createEditor(page: Page, element: HTMLElement) {
  const editor = new EditorContainer();
  editor.page = page;
  element.append(editor);

  return editor;
}

function createEditorWhenLoaded(
  workspace: Workspace,
  mode: 'edgeless' | 'page' = 'page'
) {
  return new Promise<void>(resolve => {
    workspace.slots.pageAdded.once(pageId => {
      resolve();

      const app = document.body;

      const page = workspace.getPage(pageId) as Page;
      const editor = createEditor(page, app);

      editor.mode = mode;

      window.editor = editor;
      window.page = page;
    });
  });
}

export async function setupEditor(mode: 'edgeless' | 'page' = 'page') {
  const workspace = new Workspace(createWorkspaceOptions());

  window.workspace = workspace;

  const loaded = createEditorWhenLoaded(workspace, mode);
  await initWorkspace(workspace);
  await loaded;
}

export function cleanup() {
  window.editor.remove();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).workspace;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).editor;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).page;
}
