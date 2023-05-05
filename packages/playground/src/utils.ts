import * as blocks from '@blocksuite/blocks';
import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks/models';
import * as editor from '@blocksuite/editor';
import { EditorContainer } from '@blocksuite/editor';
import {
  configDebugLog,
  disableDebuglog,
  enableDebugLog,
} from '@blocksuite/global/debug';
import * as globalUtils from '@blocksuite/global/utils';
import type { BlobStorage, Page } from '@blocksuite/store';
import type { DocProvider, Y } from '@blocksuite/store';
import * as store from '@blocksuite/store';
import {
  assertExists,
  createIndexeddbStorage,
  createMemoryStorage,
  createSimpleServerStorage,
  DebugDocProvider,
  type DocProviderConstructor,
  Generator,
  Utils,
  Workspace,
  type WorkspaceOptions,
} from '@blocksuite/store';
import type { IndexedDBProvider } from '@toeverything/y-indexeddb';
import { createIndexedDBProvider } from '@toeverything/y-indexeddb';
import { fileOpen } from 'browser-fs-access';

const params = new URLSearchParams(location.search);
const room = params.get('room') ?? Math.random().toString(16).slice(2, 8);
const providerArgs = (params.get('providers') ?? 'webrtc').split(',');
const blobStorageArgs = (params.get('blobStorage') ?? 'memory').split(',');
const featureArgs = (params.get('features') ?? '').split(',');

class IndexedDBProviderWrapper implements DocProvider {
  #provider: IndexedDBProvider;
  constructor(id: string, doc: Y.Doc) {
    this.#provider = createIndexedDBProvider(id, doc);
  }
  connect() {
    this.#provider.connect();
  }
  disconnect() {
    this.#provider.disconnect();
  }
}

export const defaultMode =
  params.get('mode') === 'edgeless' ? 'edgeless' : 'page';
export const initParam = providerArgs.includes('indexeddb')
  ? null
  : params.get('init');
export const isE2E = room.startsWith('playwright');

declare global {
  // eslint-disable-next-line no-var
  var targetPageId: string | undefined;
  // eslint-disable-next-line no-var
  var debugWorkspace: Workspace | undefined;
}

if (isE2E) {
  Object.defineProperty(window, '$blocksuite', {
    value: Object.freeze({
      store,
      blocks,
      global: { utils: globalUtils },
      editor,
    }),
  });
} else {
  Object.defineProperty(globalThis, 'openFromFile', {
    value: async function importFromFile(pageId?: string) {
      const file = await fileOpen({
        extensions: ['.ydoc'],
      });
      const buffer = await file.arrayBuffer();
      if (pageId) {
        globalThis.targetPageId = pageId;
      }
      Workspace.Y.applyUpdate(window.workspace.doc, new Uint8Array(buffer));
    },
  });

  Object.defineProperty(globalThis, 'rebuildPageTree', {
    value: async function rebuildPageTree(doc: Y.Doc, pages: string[]) {
      const pageTree = doc
        .getMap<Y.Array<Y.Map<unknown>>>('space:meta')
        .get('pages');
      if (pageTree) {
        const pageIds = pageTree.map(p => p.get('id') as string).filter(v => v);
        for (const page of pages) {
          if (!pageIds.includes(page)) {
            const map = new Workspace.Y.Map([
              ['id', page],
              ['title', ''],
              ['createDate', +new Date()],
              ['subpageIds', []],
            ]);
            pageTree.push([map]);
          }
        }
      }
    },
  });

  Object.defineProperty(globalThis, 'debugFromFile', {
    value: async function debuggerFromFile() {
      const file = await fileOpen({
        extensions: ['.ydoc'],
      });
      const buffer = await file.arrayBuffer();
      const workspace = new Workspace({
        id: 'temporary',
      })
        .register(AffineSchemas)
        .register(__unstableSchemas);
      Workspace.Y.applyUpdate(workspace.doc, new Uint8Array(buffer));
      globalThis.debugWorkspace = workspace;
    },
  });
}

export const isBase64 =
  /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;

export function initDebugConfig() {
  Object.defineProperty(globalThis, 'enableDebugLog', {
    value: enableDebugLog,
  });
  Object.defineProperty(globalThis, 'disableDebugLog', {
    value: disableDebuglog,
  });
  Object.defineProperty(globalThis, 'configDebugLog', {
    value: configDebugLog,
  });

  // Uncomment this line or paste it into console to enable debug log.
  // enableDebugLog(['CRUD']);
}

async function initWithMarkdownContent(
  workspace: Workspace,
  url: URL,
  pageId: string
) {
  const { empty: emptyInit } = await import('./data/index.js');

  emptyInit(workspace, pageId);
  const page = workspace.getPage(pageId);
  assertExists(page);
  assertExists(page.root);
  const content = await fetch(url).then(res => res.text());
  const contentParser = new window.ContentParser(page);
  return contentParser.importMarkdown(content, page.root.id);
}

export async function tryInitExternalContent(
  workspace: Workspace,
  initParam: string,
  pageId: string
) {
  if (isValidUrl(initParam)) {
    const url = new URL(initParam);
    await initWithMarkdownContent(workspace, url, pageId);
  } else if (isBase64.test(initParam)) {
    Utils.applyYjsUpdateV2(workspace, initParam);
  }
}

/**
 * Provider configuration is specified by `?providers=webrtc` or `?providers=indexeddb,webrtc` in URL params.
 * We use webrtcDocProvider by default if the `providers` param is missing.
 */
export function createWorkspaceOptions(): WorkspaceOptions {
  const providers: DocProviderConstructor[] = [];
  const blobStorages: ((id: string) => BlobStorage)[] = [];
  let idGenerator: Generator = Generator.AutoIncrement; // works only in single user mode

  if (providerArgs.includes('webrtc')) {
    providers.push(DebugDocProvider);
    idGenerator = Generator.AutoIncrementByClientId; // works in multi-user mode
  }

  if (providerArgs.includes('indexeddb')) {
    providers.push(IndexedDBProviderWrapper);
    idGenerator = Generator.UUIDv4; // works in production
  }

  if (blobStorageArgs.includes('memory')) {
    blobStorages.push(createMemoryStorage);
  }

  if (blobStorageArgs.includes('indexeddb')) {
    blobStorages.push(createIndexeddbStorage);
  }

  if (blobStorageArgs.includes('mock')) {
    blobStorages.push(createSimpleServerStorage);
  }

  if (isE2E) {
    // We need a predictable id generator in single page test environment.
    // Keep in mind that with this config, the collaboration will easily crash,
    // because all clients will count id from 0.
    idGenerator = Generator.AutoIncrement;
  }

  return {
    id: room,
    providers,
    idGenerator,
    blobStorages,
    defaultFlags: {
      enable_toggle_block: featureArgs.includes('toggle'),
      enable_set_remote_flag: true,
      enable_drag_handle: true,
      enable_block_hub: true,
      enable_database: true,
      enable_edgeless_toolbar: true,
      enable_linked_page: true,
      readonly: {
        'space:page0': false,
      },
    },
  };
}

export function isValidUrl(urlLike: string) {
  let url;
  try {
    url = new URL(urlLike);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

export const createEditor = (page: Page, element: HTMLElement) => {
  const editor = new EditorContainer();
  editor.page = page;
  editor.slots.pageLinkClicked.on(({ pageId }) => {
    const target = page.workspace.getPage(pageId);
    if (!target) {
      throw new Error(`Failed to jump to page ${pageId}`);
    }
    editor.page = target;
  });

  element.append(editor);

  editor.createBlockHub().then(blockHub => {
    document.body.appendChild(blockHub);
  });
  return editor;
};
