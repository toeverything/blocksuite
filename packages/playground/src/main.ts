import '@blocksuite/blocks';
import '@blocksuite/editor';
import { createEditor } from '@blocksuite/editor';
import {
  DebugProvider,
  IndexedDBProvider,
  createAutoIncrement,
} from '@blocksuite/store';
import './style.css';

const params = new URLSearchParams(location.search);
const room = params.get('room') ?? '';
/**
 * Specified by `?providers=debug` or `?providers=indexeddb,debug`
 * Default is debug (using webrtc)
 */
const providersFromParam = (params.get('providers') ?? 'debug')
  .split(',')
  .map(providerName => {
    switch (providerName) {
      case 'debug':
        return DebugProvider;
      case 'indexeddb':
        return IndexedDBProvider;
      default:
        throw new TypeError(
          `Unknown provider ("${providerName}") supplied in search param ?providers=... (for example "debug" and "indexeddb")`
        );
    }
  });

window.onload = () => {
  const editor = createEditor({
    room,
    providers: providersFromParam,
    idGenerator: createAutoIncrement(),
  });
  document.body.appendChild(editor);
};
