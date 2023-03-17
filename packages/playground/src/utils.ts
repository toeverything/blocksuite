import * as blocks from '@blocksuite/blocks';
import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks/models';
import * as editor from '@blocksuite/editor';
import {
  configDebugLog,
  disableDebuglog,
  enableDebugLog,
} from '@blocksuite/global/debug';
import * as globalUtils from '@blocksuite/global/utils';
import * as store from '@blocksuite/store';
import {
  assertExists,
  DebugDocProvider,
  type DocProviderConstructor,
  Generator,
  IndexedDBDocProvider,
  type StoreOptions,
  Utils,
  Workspace,
} from '@blocksuite/store';
import { fileOpen } from 'browser-fs-access';

const params = new URLSearchParams(location.search);
const room = params.get('room') ?? Math.random().toString(16).slice(2, 8);
const providerArgs = (params.get('providers') ?? 'webrtc').split(',');
const featureArgs = (params.get('features') ?? '').split(',');

export const defaultMode =
  params.get('mode') === 'edgeless' ? 'edgeless' : 'page';
export const initParam = params.get('init');
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

async function initWithMarkdownContent(workspace: Workspace, url: URL) {
  const { empty: emptyInit } = await import('./data/index.js');

  emptyInit(workspace);
  const page = workspace.getPage('page0');
  assertExists(page);
  assertExists(page.root);
  const content = await fetch(url).then(res => res.text());
  const contentParser = new window.ContentParser(page);
  return contentParser.importMarkdown(content, page.root.id);
}

export async function tryInitExternalContent(
  workspace: Workspace,
  initParam: string
) {
  if (isValidUrl(initParam)) {
    const url = new URL(initParam);
    await initWithMarkdownContent(workspace, url);
  } else if (isBase64.test(initParam)) {
    Utils.applyYjsUpdateV2(workspace, initParam);
  }
}

/**
 * Provider configuration is specified by `?providers=webrtc` or `?providers=indexeddb,webrtc` in URL params.
 * We use webrtcDocProvider by default if the `providers` param is missing.
 */
export function createWorkspaceOptions(): Pick<
  StoreOptions,
  'providers' | 'idGenerator' | 'id' | 'defaultFlags'
> {
  const providers: DocProviderConstructor[] = [];
  let idGenerator: Generator = Generator.AutoIncrement; // works only in single user mode

  if (providerArgs.includes('webrtc')) {
    providers.push(DebugDocProvider);
    idGenerator = Generator.AutoIncrementByClientId; // works in multi-user mode
  }

  if (providerArgs.includes('indexeddb')) {
    providers.push(IndexedDBDocProvider);
    idGenerator = Generator.UUIDv4; // works in production
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
    defaultFlags: {
      enable_toggle_block: featureArgs.includes('toggle'),
      enable_set_remote_flag: true,
      enable_drag_handle: true,
      enable_block_hub: true,
      enable_database: true,
      enable_edgeless_toolbar: true,
      enable_bi_directional_link: true,
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
