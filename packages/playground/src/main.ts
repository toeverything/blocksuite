import '@blocksuite/blocks';
import '@blocksuite/editor';
import { BlockSchema, createEditor } from '@blocksuite/editor';
import type {
  Space,
  StoreOptions,
  SyncProviderConstructor,
} from '@blocksuite/store';
import {
  createAutoIncrement,
  DebugProvider,
  IndexedDBProvider,
  Store,
  uuidv4,
} from '@blocksuite/store';
import { inits } from './inits';

import './style.css';

const searchParams = (() => {
  const params = new URLSearchParams(location.search);
  return {
    /**
     * In test environments and locally, you can set `?init=` to get a page with a specific configuration ready to go.
     * These are listed in {@link inits}
     */
    init: params.get('init') || null,
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
  'providers' | 'idGenerator' | 'room'
> {
  const room = searchParams.room;
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
    room,
    providers,
    idGenerator,
  };
}

// Add @deprecated to indicate that no one should depend on these existing
declare global {
  interface Window {
    /** @deprecated Added by BlockSuite playground (for easy access from dev console) */
    store: Store;
    /** @deprecated Added by BlockSuite playground (for easy access from dev console) */
    space: Space;
  }
}

window.onload = () => {
  const store = new Store(editorOptionsFromParam());

  // Make store accessible to dev console & to evaluate scripts in e2e
  window.store = store;

  if (!searchParams.init) {
    // default init
    const space = store.createSpace('page0').register(BlockSchema);
    const editor = createEditor(space);
    document.body.appendChild(editor);
    window.space = space;
  } else {
    const foundInitSetup =
      inits[searchParams.init as BlockSuitePlaygroundInitKey];
    if (!foundInitSetup) {
      throw new Error(
        `Unknown init id (${JSON.stringify(
          searchParams.init
        )}) did not match any known ids in (${Object.keys(inits).join(', ')}).`
      );
    }

    window.space = foundInitSetup.setup({
      blockSchema: BlockSchema,
      store,
    });
  }
};
