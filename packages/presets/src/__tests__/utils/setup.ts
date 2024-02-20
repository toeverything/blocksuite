import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks/models';
import { assertExists } from '@blocksuite/global/utils';
import {
  type BlobStorage,
  type Page,
  Text,
  Workspace,
} from '@blocksuite/store';
import { createMemoryStorage, Generator, Schema } from '@blocksuite/store';

import { AffineEditorContainer } from '../../index.js';

function createWorkspaceOptions() {
  const blobStorages: ((id: string) => BlobStorage)[] = [];
  const schema = new Schema();
  const room = Math.random().toString(16).slice(2, 8);

  schema.register(AffineSchemas).register(__unstableSchemas);

  const idGenerator: Generator = Generator.AutoIncrement; // works only in single user mode

  blobStorages.push(createMemoryStorage);

  return {
    id: room,
    schema,
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

function initWorkspace(workspace: Workspace) {
  const page = workspace.createPage({ id: 'page:home' });

  page.load(() => {
    const pageBlockId = page.addBlock('affine:page', {
      title: new Text(),
    });
    page.addBlock('affine:surface', {}, pageBlockId);
  });
  page.resetHistory();
}

async function createEditor(
  workspace: Workspace,
  mode: 'edgeless' | 'page' = 'page'
) {
  const app = document.createElement('div');
  const page = workspace.pages.values().next().value as Page | undefined;
  assertExists(page, 'Need to create a page first');
  const editor = new AffineEditorContainer();
  editor.page = page;
  editor.mode = mode;
  app.append(editor);

  window.editor = editor;
  window.page = page;

  app.style.width = '100%';
  app.style.height = '1280px';

  document.body.append(app);
  await editor.updateComplete;
  return app;
}

export async function setupEditor(mode: 'edgeless' | 'page' = 'page') {
  const workspace = new Workspace(createWorkspaceOptions());

  window.workspace = workspace;

  initWorkspace(workspace);
  const appElement = await createEditor(workspace, mode);

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
