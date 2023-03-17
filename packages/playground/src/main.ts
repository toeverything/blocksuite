/// <reference types="./env" />
import '@blocksuite/blocks';
import '@blocksuite/editor';
import './components/start-panel';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import '@blocksuite/editor/themes/affine.css';

import { ContentParser } from '@blocksuite/blocks';
import { __unstableSchemas, builtInSchemas } from '@blocksuite/blocks/models';
import std from '@blocksuite/blocks/std';
import { EditorContainer } from '@blocksuite/editor';
import type { Page } from '@blocksuite/store';
import { Workspace } from '@blocksuite/store';

import { DebugMenu } from './components/debug-menu.js';
import type { InitFn } from './data';
import {
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
    const page = workspace.getPage(pageId) as Page;

    const editor = new EditorContainer();
    editor.page = page;

    document.getElementById('app')?.append(editor);

    const contentParser = new ContentParser(page);
    const debugMenu = new DebugMenu();
    debugMenu.workspace = workspace;
    debugMenu.editor = editor;
    debugMenu.mode = defaultMode;
    debugMenu.contentParser = contentParser;
    document.body.appendChild(debugMenu);
    editor.createBlockHub().then(blockHub => {
      document.body.appendChild(blockHub);
    });

    window.editor = editor;
    window.page = page;
  });
}

async function initPageContentByParam(workspace: Workspace, param: string) {
  const functionMap = new Map<
    string,
    (workspace: Workspace) => Promise<string>
  >();
  Object.values(
    (await import('./data/index.js')) as Record<string, InitFn>
  ).forEach(fn => {
    functionMap.set(fn.id, fn);
  });
  // Load the preset playground documentation when `?init` param provided
  if (param === '') {
    param = 'preset';
  }

  // Load built-in init function when `?init=heavy` param provided
  if (functionMap.has(param)) {
    await functionMap.get(param)?.(workspace);
    return;
  }

  // Try to load base64 content or markdown content from url
  await tryInitExternalContent(workspace, param);
}

async function main() {
  const workspace = new Workspace(options)
    .register(builtInSchemas)
    .register(__unstableSchemas);

  window.workspace = workspace;
  window.blockSchemas = builtInSchemas;
  window.Y = Workspace.Y;
  window.std = std;
  window.ContentParser = ContentParser;

  workspace.connect();

  // In E2E environment, initial state should be generated by test case,
  // instead of using this default setup.
  if (isE2E) return;

  subscribePage(workspace);
  if (initParam !== null) {
    await initPageContentByParam(workspace, initParam);
    return;
  }

  // Open default examples list when no `?init` param is provided
  const exampleList = document.createElement('start-panel');
  workspace.slots.pageAdded.once(() => exampleList.remove());
  document.body.prepend(exampleList);
}

main();
