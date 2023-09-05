/// <reference types="./env.d.ts" />
import '@blocksuite/blocks';
import '@blocksuite/editor';
import './components/start-panel';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/editor/themes/affine.css';

import { TestUtils } from '@blocksuite/blocks';
import { ContentParser } from '@blocksuite/blocks/content-parser';
import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks/models';
import std from '@blocksuite/blocks/std';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { DocProvider, Page } from '@blocksuite/store';
import { Job, Workspace } from '@blocksuite/store';

import { CustomNavigationPanel } from './components/custom-navigation-panel';
import { DebugMenu } from './components/debug-menu.js';
import type { InitFn } from './data';
import {
  createEditor,
  createWorkspaceOptions,
  defaultMode,
  initDebugConfig,
  initParam,
  isE2E,
  tryInitExternalContent,
} from './utils.js';

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
    const debugMenu = new DebugMenu();
    const navigationPanel = new CustomNavigationPanel();

    debugMenu.workspace = workspace;
    debugMenu.editor = editor;
    debugMenu.mode = defaultMode;
    debugMenu.contentParser = contentParser;
    debugMenu.navigationPanel = navigationPanel;
    navigationPanel.editor = editor;
    document.body.appendChild(debugMenu);
    document.body.appendChild(navigationPanel);

    window.editor = editor;
    window.page = page;
  });
}

export async function initPageContentByParam(
  workspace: Workspace,
  param: string,
  pageId: string
) {
  const functionMap = new Map<
    string,
    (workspace: Workspace, id: string) => void
  >();
  Object.values(
    (await import('./data/index.js')) as Record<string, InitFn>
  ).forEach(fn => functionMap.set(fn.id, fn));
  // Load the preset playground documentation when `?init` param provided
  if (param === '') {
    param = 'preset';
  }

  // Load built-in init function when `?init=heavy` param provided
  if (functionMap.has(param)) {
    functionMap.get(param)?.(workspace, pageId);
    const page = workspace.getPage(pageId);
    await page?.waitForLoaded();
    page?.resetHistory();
    return;
  }

  // Try to load base64 content or markdown content from url
  await tryInitExternalContent(workspace, param, pageId);
}

async function main() {
  if (window.workspace) {
    return;
  }
  const workspace = new Workspace(options);
  window.workspace = workspace;
  window.job = new Job({ workspace });
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

  const syncProviders = async (providers: DocProvider[]) => {
    for (const provider of providers) {
      if ('active' in provider) {
        provider.sync();
        await provider.whenReady;
      } else if ('passive' in provider) {
        provider.connect();
      }
    }
  };

  await syncProviders(workspace.providers);

  workspace.slots.pageAdded.on(async pageId => {
    const page = workspace.getPage(pageId) as Page;
    await page.waitForLoaded();
  });

  window.testUtils = new TestUtils();

  // In E2E environment, initial state should be generated by test case,
  // instead of using this default setup.
  if (isE2E) return;

  subscribePage(workspace);
  if (initParam !== null) {
    await initPageContentByParam(workspace, initParam, 'page0');
    return;
  }

  // Open default examples list when no `?init` param is provided
  const exampleList = document.createElement('start-panel');
  workspace.slots.pageAdded.once(() => exampleList.remove());
  document.body.prepend(exampleList);
}

main();
