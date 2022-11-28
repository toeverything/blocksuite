import '@blocksuite/blocks';
import '@blocksuite/editor';
import { createEditor, createDebugMenu, BlockSchema } from '@blocksuite/editor';
import {
  DebugProvider,
  IndexedDBProvider,
  createAutoIncrement,
  uuidv4,
  Store,
} from '@blocksuite/store';
import type { SyncProviderConstructor, StoreOptions } from '@blocksuite/store';

import './style.css';

const params = new URLSearchParams(location.search);
const room = params.get('room') ?? '';
const isTest = params.get('isTest') === 'true';

/**
 * Specified by `?syncModes=debug` or `?syncModes=indexeddb,debug`
 * Default is debug (using webrtc)
 */
function editorOptionsFromParam(): Pick<
  StoreOptions,
  'providers' | 'idGenerator'
> {
  const providers: SyncProviderConstructor[] = [];

  const modes = (params.get('syncModes') ?? 'debug').split(',');

  modes.forEach(mode => {
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
    room: room,
    ...editorOptionsFromParam(),
  });
  // @ts-ignore
  window.store = store;
  // @ts-ignore
  window.blockSchema = BlockSchema;

  // In dev environment, init editor by default, but in test environment, init editor by the test page
  if (!isTest) {
    const space = store
      .createSpace('page0')
      // @ts-ignore
      .register(window.blockSchema);
    const editor = createEditor(space);
    const debugMenu = createDebugMenu(store, editor);

    document.body.appendChild(editor);
    document.body.appendChild(debugMenu);
    const idPage = space.addBlock({ flavour: 'affine:page' });
    const idGroup = space.addBlock({ flavour: 'affine:group' }, idPage);
    space.addBlock(
      {
        flavour: 'affine:embed',
        type: 'image',
        source:
          'https://m.media-amazon.com/images/G/02/Gateway/BF22Hero/UK-600x226.jpg',
        width: 200,
      },
      idGroup
    );
  }
};
