import { __unstableSchemas, AffineSchemas } from '@blocksuite/blocks/models';
import { EditorContainer } from '@blocksuite/editor';
import type { BlobStorage, Page, Workspace } from '@blocksuite/store';
import {
  createIndexeddbStorage,
  Generator,
  Schema,
  type WorkspaceOptions,
} from '@blocksuite/store';

import { getPlaygroundPresets } from './preset.js';
import { INDEXED_DB_NAME } from './providers/indexeddb-provider.js';

export const params = new URLSearchParams(location.search);
export const defaultMode = params.get('mode') === 'page' ? 'page' : 'edgeless';

const featureArgs = (params.get('features') ?? '').split(',');

export function getOptions(
  fn: (params: URLSearchParams) => Record<string, string | number>
) {
  return fn(params);
}

declare global {
  // eslint-disable-next-line no-var
  var targetPageId: string | undefined;
  // eslint-disable-next-line no-var
  var debugWorkspace: Workspace | undefined;
}

/**
 * Provider configuration is specified by `?providers=broadcast` or `?providers=indexeddb,broadcast` in URL params.
 * We use BroadcastChannelProvider by default if the `providers` param is missing.
 */
export function createWorkspaceOptions(): WorkspaceOptions {
  const blobStorages: ((id: string) => BlobStorage)[] = [
    createIndexeddbStorage,
  ];
  const idGenerator: Generator = Generator.NanoID;
  const schema = new Schema();
  schema.register(AffineSchemas).register(__unstableSchemas);

  return {
    id: 'quickEdgeless',
    schema,
    providerCreators: [],
    idGenerator,
    blobStorages,
    defaultFlags: {
      enable_toggle_block: featureArgs.includes('toggle'),
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

export async function testIDBExistence() {
  return new Promise<boolean>(resolve => {
    const request = indexedDB.open(INDEXED_DB_NAME);
    request.onupgradeneeded = function () {
      request.transaction?.abort();
      request.result.close();
      resolve(false);
    };
    request.onsuccess = function () {
      request.result.close();
      resolve(true);
    };
  });
}

export function createEditor(page: Page, element: HTMLElement) {
  const presets = getPlaygroundPresets();

  const editor = new EditorContainer();
  editor.pagePreset = presets.pageModePreset;
  editor.edgelessPreset = presets.edgelessModePreset;
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
}
