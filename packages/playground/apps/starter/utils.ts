import * as blocks from '@blocksuite/blocks';
import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks/models';
import * as editor from '@blocksuite/editor';
import { EditorContainer } from '@blocksuite/editor';
import * as globalUtils from '@blocksuite/global/utils';
import { assertExists } from '@blocksuite/global/utils';
import type {
  BlobStorage,
  DocProviderCreator,
  Page,
  PassiveDocProvider,
  Workspace,
  Y,
} from '@blocksuite/store';
import * as store from '@blocksuite/store';
import {
  createIndexeddbStorage,
  createMemoryStorage,
  createSimpleServerStorage,
  Generator,
  Schema,
  type WorkspaceOptions,
} from '@blocksuite/store';
import { createBroadcastChannelProvider } from '@blocksuite/store/providers/broadcast-channel';
import type { IndexedDBProvider } from '@toeverything/y-indexeddb';
import { createIndexedDBProvider } from '@toeverything/y-indexeddb';

const params = new URLSearchParams(location.search);
const room = params.get('room') ?? Math.random().toString(16).slice(2, 8);
const providerArgs = (params.get('providers') ?? 'bc').split(',');
const blobStorageArgs = (params.get('blobStorage') ?? 'memory').split(',');
const featureArgs = (params.get('features') ?? '').split(',');

class IndexedDBProviderWrapper implements PassiveDocProvider {
  public readonly flavour = 'blocksuite-indexeddb';
  public readonly passive = true as const;
  private _connected = false;
  private _provider: IndexedDBProvider;
  constructor(doc: Y.Doc) {
    this._provider = createIndexedDBProvider(doc);
  }
  connect() {
    this._provider.connect();
    this._connected = true;
  }
  disconnect() {
    this._provider.disconnect();
    this._connected = false;
  }
  get connected() {
    return this._connected;
  }
}

export const defaultMode =
  params.get('mode') === 'edgeless' ? 'edgeless' : 'page';
export const initParam = params.get('init');
export const isE2E = room.startsWith('playwright');

export const getOptions = (
  fn: (params: URLSearchParams) => Record<string, string | number>
) => fn(params);

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

function isValidUrl(urlLike: string) {
  let url;
  try {
    url = new URL(urlLike);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

export async function tryInitExternalContent(
  workspace: Workspace,
  initParam: string,
  pageId: string
) {
  if (isValidUrl(initParam)) {
    const url = new URL(initParam);
    await initWithMarkdownContent(workspace, url, pageId);
  }
}

/**
 * Provider configuration is specified by `?providers=broadcast` or `?providers=indexeddb,broadcast` in URL params.
 * We use BroadcastChannelProvider by default if the `providers` param is missing.
 */
export function createWorkspaceOptions(): WorkspaceOptions {
  const providerCreators: DocProviderCreator[] = [];
  const blobStorages: ((id: string) => BlobStorage)[] = [];
  const schema = new Schema();
  schema.register(AffineSchemas).register(__unstableSchemas);

  let idGenerator: Generator = Generator.AutoIncrement; // works only in single user mode

  if (providerArgs.includes('idb')) {
    providerCreators.push((_id, doc) => new IndexedDBProviderWrapper(doc));
    idGenerator = Generator.NanoID; // works in production
  }

  if (providerArgs.includes('bc')) {
    providerCreators.push(createBroadcastChannelProvider);
    idGenerator = Generator.NanoID; // works in production
  }

  if (blobStorageArgs.includes('memory')) {
    blobStorages.push(createMemoryStorage);
  }

  if (blobStorageArgs.includes('idb')) {
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
    schema,
    providerCreators,
    idGenerator,
    blobStorages,
    defaultFlags: {
      enable_toggle_block: featureArgs.includes('toggle'),
      enable_transformer_clipboard: featureArgs.includes('clipboard'),
      enable_set_remote_flag: true,
      enable_block_hub: true,
      enable_note_index: true,
      enable_bultin_ledits: true,
      readonly: {
        'page:home': false,
      },
    },
  };
}

export function createEditor(page: Page, element: HTMLElement) {
  const editor = new EditorContainer();
  editor.page = page;
  element.append(editor);

  editor.createBlockHub().then(blockHub => {
    document.body.appendChild(blockHub);
  });
  return editor;
}
