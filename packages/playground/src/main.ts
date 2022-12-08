// import * as Y from 'yjs';
import '@blocksuite/blocks';
import '@blocksuite/editor';
import { createEditor, createDebugMenu, BlockSchema } from '@blocksuite/editor';
import {
  DebugDocProvider,
  IndexedDBDocProvider,
  createWebsocketDocProvider,
  createAutoIncrementIdGenerator,
  uuidv4,
  Workspace,
} from '@blocksuite/store';
import type { DocProviderConstructor, StoreOptions } from '@blocksuite/store';
import './style.css';

const params = new URLSearchParams(location.search);
const room = params.get('room') ?? 'playground';
const joining = params.get('collab') !== null;

/**
 * Specified by `?syncModes=debug` or `?syncModes=indexeddb,debug`
 * Default is debug (using webrtc)
 */
function editorOptionsFromParam(): Pick<
  StoreOptions,
  'providers' | 'idGenerator'
> {
  const providers: DocProviderConstructor[] = [];

  /**
   * Specified using "uuidv4" when providers have indexeddb.
   * Because when persistent data applied to ydoc, we need generator different id for block.
   * Otherwise, the block id will conflict.
   */
  let forceUUIDv4 = false;

  const modes = (params.get('syncModes') ?? 'debug').split(',');

  modes.forEach(mode => {
    switch (mode) {
      case 'debug':
        providers.push(DebugDocProvider);
        break;
      case 'indexeddb':
        providers.push(IndexedDBDocProvider);
        forceUUIDv4 = true;
        break;
      case 'websocket': {
        const WebsocketDocProvider = createWebsocketDocProvider(
          'ws://127.0.0.1:1234'
        );
        providers.push(WebsocketDocProvider);
        forceUUIDv4 = true;
        break;
      }
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
  const idGenerator = forceUUIDv4 ? uuidv4 : createAutoIncrementIdGenerator();

  return {
    providers,
    idGenerator,
  };
}

window.onload = () => {
  const workspace = new Workspace({
    room,
    ...editorOptionsFromParam(),
  });
  // @ts-ignore
  window.workspace = workspace;
  // @ts-ignore
  window.blockSchema = BlockSchema;

  if (joining) return;

  // Init default workspace for manual local testing.
  // In single mode E2E test cases, room name are random IDs.
  if (room === 'playground') {
    const page = workspace
      .createPage<typeof BlockSchema>('page0')
      .register(BlockSchema);
    const editor = createEditor(page);
    const debugMenu = createDebugMenu(workspace, editor);

    document.body.appendChild(editor);
    document.body.appendChild(debugMenu);
  }
};

// window.Y = Y;
