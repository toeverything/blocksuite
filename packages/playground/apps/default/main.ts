/// <reference types="../starter/env" />
import '@blocksuite/blocks';
import '@blocksuite/editor';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/editor/themes/affine.css';

import { ContentParser } from '@blocksuite/blocks/content-parser';
import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks/models';
import std from '@blocksuite/blocks/std';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { DocProviderCreator, Page } from '@blocksuite/store';
import { Workspace } from '@blocksuite/store';

import { QuickEdgelessMenu } from './components/quick-edgeless-menu.js';
import { INDEXED_DB_NAME } from './providers/indexeddb-provider.js';
import { initCollaborationSocket } from './providers/websocket-channel.js';
import {
  createEditor,
  createWorkspaceOptions,
  defaultMode,
  initDebugConfig,
  params,
  testIDBExistence,
} from './utils.js';
import { loadPresets } from './utils/preset.js';
import { getProviderCreators } from './utils/providers.js';

const options = createWorkspaceOptions();
initDebugConfig();

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
    const contentParser = new ContentParser(page);
    const quickEdgelessMenu = new QuickEdgelessMenu();
    quickEdgelessMenu.workspace = workspace;
    quickEdgelessMenu.editor = editor;
    quickEdgelessMenu.mode = defaultMode;
    quickEdgelessMenu.contentParser = contentParser;
    document.body.appendChild(quickEdgelessMenu);

    window.editor = editor;
    window.page = page;
  });
}

export async function initContentByInitParam(
  workspace: Workspace,
  param: string,
  pageId: string
) {
  const presetsMap = await loadPresets();

  if (!presetsMap.has(param)) param = 'empty';

  // Load built-in init function when `?init=heavy` param provided
  if (presetsMap.has(param)) {
    presetsMap.get(param)?.(workspace, pageId);
    const page = workspace.getPage(pageId);
    await page?.waitForLoaded();
    page?.resetHistory();
  }
}

const syncProviders = async (
  workspace: Workspace,
  providerCreators: DocProviderCreator[]
) => {
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
  const oldVersions = oldMeta ? { ...JSON.parse(oldMeta).blockVersions } : null;

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
    await page.waitForLoaded().catch(e => {
      const isValidateError =
        e instanceof Error && e.message.includes('outdated');
      if (isValidateError) {
        page.spaceDoc.once('update', () => {
          workspace.schema.upgradePage(oldVersions, page.spaceDoc);
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
};

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
    await initContentByInitParam(
      workspace,
      params.get('init') ?? 'empty',
      'page0'
    );
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
  window.Y = Workspace.Y;
  window.std = std;
  window.ContentParser = ContentParser;
  Object.defineProperty(globalThis, 'root', {
    get() {
      return document.querySelector('block-suite-root') as BlockSuiteRoot;
    },
  });
  workspace.awarenessStore.setFlag('enable_page_tags', true);

  subscribePage(workspace);
  initWorkspace(workspace);
}

main();
