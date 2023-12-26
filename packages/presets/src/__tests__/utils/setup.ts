import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks/models.js';
import {
  type BlobStorage,
  type DocProviderCreator,
  type Page,
  Text,
  Workspace,
} from '@blocksuite/store';
import { createMemoryStorage, Generator, Schema } from '@blocksuite/store';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { AffineEditorContainer } from '../../index.js';

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
  const editor = new AffineEditorContainer();
  editor.page = page;
  element.append(editor);

  return editor;
}

function createEditorWhenLoaded(
  workspace: Workspace,
  mode: 'edgeless' | 'page' = 'page'
) {
  return new Promise<HTMLDivElement>(resolve => {
    workspace.slots.pageAdded.once(pageId => {
      const app = document.createElement('div');
      const page = workspace.getPage(pageId) as Page;
      const editor = createEditor(page, app);

      editor.mode = mode;

      window.editor = editor;
      window.page = page;

      app.style.width = '100%';
      app.style.height = '1280px';

      document.body.append(app);

      resolve(app);
    });
  });
}

export async function setupEditor(mode: 'edgeless' | 'page' = 'page') {
  const workspace = new Workspace(createWorkspaceOptions());

  window.workspace = workspace;

  const loaded = createEditorWhenLoaded(workspace, mode);
  await initWorkspace(workspace);
  const appElement = await loaded;

  return () => {
    appElement.remove();
    cleanup();
  };
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
