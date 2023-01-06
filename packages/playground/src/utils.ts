import {
  DebugDocProvider,
  DocProviderConstructor,
  Generator,
  IndexedDBDocProvider,
  StoreOptions,
} from '@blocksuite/store';

const params = new URLSearchParams(location.search);
// We need to split room between different PR, branches, and local version
const room =
  params.get('room') ?? typeof window !== 'undefined'
    ? import.meta.env.VITE_DEFAULT_ROOM
      ? import.meta.env.VITE_DEFAULT_ROOM
      : window.location.origin + window.location.pathname
    : 'playground';
const url = new URL(window.location.href);
export const defaultMode =
  url.searchParams.get('mode') === 'edgeless' ? 'edgeless' : 'page';
export const initParam = params.get('init');
export const isE2E = params.get('room')?.includes('playwright');
export const isBase64 =
  /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;

console.log('default room:', room);

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
        console.warn(
          'Websocket provider is not maintained in BlockSuite currently.'
        );
        break;
      }
      default:
        throw new TypeError(
          `Unknown provider ("${mode}") supplied in search param ?syncModes=... (for example "debug" and "indexeddb")`
        );
    }
  });

  let idGenerator = forceUUIDv4
    ? Generator.UUIDv4
    : Generator.AutoIncrementByClientId;

  if (isE2E) {
    // We need a predictable id generator in single page test environment.
    // Keep in mind that with this config, the collaboration will easily crash,
    // because all clients will count id from 0.
    idGenerator = Generator.AutoIncrement;
  }

  return {
    room,
    providers,
    idGenerator,
  };
}
