import '@blocksuite/blocks';
import '@blocksuite/editor';
import { BlockSchema, createEditor } from '@blocksuite/editor';
import type { StoreOptions, SyncProviderConstructor } from '@blocksuite/store';
import {
  createAutoIncrement,
  DebugProvider,
  IndexedDBProvider,
  Store,
  uuidv4,
} from '@blocksuite/store';

import './style.css';

const searchParams = (() => {
  const params = new URLSearchParams(location.search);
  return {
    isTest: params.get('isTest') === 'true',
    room: params.get('room') ?? '',
    syncModes: (params.get('syncModes') ?? 'debug').split(','),
  };
})();

/**
 * Specified by `?syncModes=debug` or `?syncModes=indexeddb,debug`
 * Default is debug (using webrtc)
 */
function editorOptionsFromParam(): Pick<
  StoreOptions,
  'providers' | 'idGenerator'
> {
  const providers: SyncProviderConstructor[] = [];

  searchParams.syncModes.forEach(mode => {
    switch (mode) {
      case 'debug':
        providers.push(DebugProvider);
        break;
      case 'indexeddb':
        providers.push(IndexedDBProvider);
        break;
      default:
        throw new TypeError(
          `Unknown provider ("${mode}") supplied in search param ?syncModes=... (for example "debug" and "indexeddb")`
        );
    }
  });

  /**
   * Specified using "uuidv4" when providers have indexeddb.
   * Because when persistent data applied to ydoc, we need generator different id for block.
   * Otherwise, the block id will conflict.
   *
   * Question: Wouldn't these ids potentially conflict any time there is any existing document, though?
   * Or if there is a collaborative document?
   */
  const idGenerator = providers.includes(IndexedDBProvider)
    ? uuidv4
    : createAutoIncrement();

  return {
    providers,
    idGenerator,
  };
}

window.onload = () => {
  const store = new Store({
    room: searchParams.room,
    ...editorOptionsFromParam(),
  });
  // @ts-ignore
  window.store = store;
  // @ts-ignore
  window.blockSchema = BlockSchema;

  // In dev environment, init editor by default, but in test environment, init editor by the test page
  if (!searchParams.isTest) {
    const space = store
      .createSpace('page0')
      // @ts-ignore
      .register(window.blockSchema);
    const editor = createEditor(space);
    document.body.appendChild(editor);
  }
};
