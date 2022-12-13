import {
  createAutoIncrementIdGenerator,
  createWebsocketDocProvider,
  DebugDocProvider,
  DocProviderConstructor,
  IndexedDBDocProvider,
  StoreOptions,
  uuidv4,
} from '@blocksuite/store';

const params = new URLSearchParams(location.search);
const room = params.get('room') ?? 'playground';

/**
 * Specified by `?syncModes=debug` or `?syncModes=indexeddb,debug`
 * Default is debug (using webrtc)
 */
export function getOptions(): Pick<
  StoreOptions,
  'providers' | 'idGenerator' | 'room'
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
    room,
    providers,
    idGenerator,
  };
}
