/// <reference types="../starter/env" />
import '@blocksuite/blocks';
import '@blocksuite/presets';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/presets/themes/affine.css';

import { ContentParser } from '@blocksuite/blocks/content-parser';
import { AffineSchemas } from '@blocksuite/blocks/models';
import type { EditorHost } from '@blocksuite/lit';
import { type DocProviderCreator, type Page, Text } from '@blocksuite/store';
import { Job, Workspace } from '@blocksuite/store';

import { QuickEdgelessMenu } from './components/quick-edgeless-menu.js';
import { INDEXED_DB_NAME } from './providers/indexeddb-provider.js';
import { initCollaborationSocket } from './providers/websocket-channel.js';
import {
  createEditor,
  createWorkspaceOptions,
  defaultMode,
  params,
  testIDBExistence,
} from './utils.js';
import { getProviderCreators } from './utils/providers.js';

const options = createWorkspaceOptions();

// Subscribe for page update and create editor after page loaded.
function subscribePage(workspace: Workspace) {
  workspace.slots.pageAdded.once(pageId => {
    if (typeof globalThis.targetPageId === 'string') {
      if (pageId !== globalThis.targetPageId) {
        // if there's `targetPageId` which not same as the `pageId`
        return;
      }
    }
    const app = document.getElementById('app');
    if (!app) {
      return;
    }
    const page = workspace.getPage(pageId) as Page;

    const editor = createEditor(page, app);
    const quickEdgelessMenu = new QuickEdgelessMenu();
    quickEdgelessMenu.workspace = workspace;
    quickEdgelessMenu.editor = editor;
    quickEdgelessMenu.mode = defaultMode;

    document.body.appendChild(quickEdgelessMenu);

    page.slots.ready.on(() => {
      const contentParser = new ContentParser(editor.host, page);
      quickEdgelessMenu.contentParser = contentParser;
    });

    window.editor = editor;
    window.page = page;
  });
}

async function syncProviders(
  workspace: Workspace,
  providerCreators: DocProviderCreator[]
) {
  if (params.get('room')) {
    await initCollaborationSocket(workspace, params.get('room') as string);
  }

  providerCreators.forEach(fn => workspace.registerProvider(fn));
  const providers = workspace.providers;

  for (const provider of providers) {
    if ('active' in provider) {
      provider.sync();
      await provider.whenReady;
    } else if ('passive' in provider) {
      provider.connect();
    }
  }

  const oldMeta = localStorage.getItem('meta');
  const oldPageVersion = oldMeta ? JSON.parse(oldMeta).pageVersion : 0;
  const oldBlockVersions = oldMeta
    ? { ...JSON.parse(oldMeta).blockVersions }
    : {};

  let run = true;
  const runWorkspaceMigration = () => {
    if (run) {
      workspace.schema.upgradeWorkspace(workspace.doc);
      const meta = workspace.doc.toJSON().meta;
      localStorage.setItem('meta', JSON.stringify(meta));
      run = false;
    }
  };

  workspace.slots.pageAdded.on(async pageId => {
    const page = workspace.getPage(pageId) as Page;
    await page.load().catch(e => {
      const isValidateError =
        e instanceof Error && e.message.includes('outdated');
      if (isValidateError) {
        page.spaceDoc.once('update', () => {
          workspace.schema.upgradePage(
            oldPageVersion,
            oldBlockVersions,
            page.spaceDoc
          );
          workspace.meta.updateVersion(workspace);
          page.trySyncFromExistingDoc();
        });
        return;
      }
      throw e;
    });
    page.spaceDoc.once('update', () => {
      runWorkspaceMigration();
    });
  });
}

async function initWorkspace(workspace: Workspace) {
  const databaseExists = await testIDBExistence();

  const shouldInit =
    (!databaseExists && !params.get('room')) || params.get('init');

  if (shouldInit) {
    const deleteResult = await new Promise(resovle => {
      const req = indexedDB.deleteDatabase(INDEXED_DB_NAME);
      req.onerror = resovle;
      req.onblocked = resovle;
      req.onsuccess = resovle;
    });

    console.info('Delete database: ', deleteResult);

    await syncProviders(workspace, getProviderCreators());
    const page = workspace.createPage({ id: 'page:home' });
    await page.load(() => {
      const pageBlockId = page.addBlock('affine:page', {
        title: new Text(),
      });
      page.addBlock('affine:surface', {}, pageBlockId);
    });
    page.resetHistory();
  } else {
    await syncProviders(workspace, getProviderCreators());
  }
}

async function main() {
  if (window.workspace) {
    return;
  }

  const workspace = new Workspace(options);
  window.workspace = workspace;
  window.blockSchemas = AffineSchemas;
  window.job = new Job({ workspace });
  window.Y = Workspace.Y;
  window.ContentParser = ContentParser;
  Object.defineProperty(globalThis, 'host', {
    get() {
      return document.querySelector('editor-host') as EditorHost;
    },
  });

  subscribePage(workspace);
  await initWorkspace(workspace);
}

main().catch(console.error);
