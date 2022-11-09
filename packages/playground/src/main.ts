import '@blocksuite/blocks';
import '@blocksuite/editor';
import { createEditor } from '@blocksuite/editor';
import {
  DebugProvider,
  IndexedDBProvider,
  createAutoIncrement,
  uuidv4,
} from '@blocksuite/store';
import type { SyncProviderConstructor, StoreOptions } from '@blocksuite/store';
import './style.css';

const params = new URLSearchParams(location.search);
const room = params.get('room') ?? '';

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
  const editor = createEditor({
    room,
    ...editorOptionsFromParam(),
  });
  document.body.appendChild(editor);
};
