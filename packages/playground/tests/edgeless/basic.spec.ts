// eslint-disable-next-line @typescript-eslint/no-restricted-imports

import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks/models';
import { EditorContainer } from '@blocksuite/editor';
import type { BlobStorage, DocProviderCreator, Page } from '@blocksuite/store';
import {
  createMemoryStorage,
  Generator,
  Job,
  Schema,
  Workspace,
} from '@blocksuite/store';
import { afterEach, beforeEach, expect, test } from 'vitest';

const createWorkspaceOptions = () => {
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
      enable_toggle_block: true,
      enable_transformer_clipboard: true,
      enable_set_remote_flag: true,
      enable_block_hub: true,
      enable_note_index: true,
      enable_bultin_ledits: true,
      readonly: {
        'page:home': false,
      },
    },
  };
};
const createEditor = (page: Page, element: HTMLElement) => {
  const editor = new EditorContainer();
  editor.page = page;
  element.append(editor);

  return editor;
};
const initWorkspace = async (workspace: Workspace) => {
  const page = workspace.createPage({ id: 'page:home' });

  await page.load(() => {
    const pageBlockId = page.addBlock('affine:page', {
      title: new Text(),
    });
    page.addBlock('affine:surface', {}, pageBlockId);
  });
  page.resetHistory();
};
const subscribePage = (workspace: Workspace) => {
  return new Promise<void>(resolve => {
    workspace.slots.pageAdded.once(pageId => {
      resolve();

      const app = document.body;

      const page = workspace.getPage(pageId) as Page;
      const editor = createEditor(page, app);

      editor.mode = 'edgeless';

      window.editor = editor;
      window.page = page;
    });
  });
};

beforeEach(async () => {
  const workspace = new Workspace(createWorkspaceOptions());

  window.workspace = workspace;
  window.job = new Job({ workspace });

  const loaded = subscribePage(workspace);
  await initWorkspace(workspace);
  await loaded;
});

afterEach(() => {
  window.editor.remove();
});

test('basic', () => {
  expect(window.page).toBeDefined();
  expect(window.editor).toBeDefined();
  expect(window.editor.mode).toBe('edgeless');
});
