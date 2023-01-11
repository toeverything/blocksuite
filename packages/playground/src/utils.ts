import {
  DebugDocProvider,
  DocProviderConstructor,
  Generator,
  IndexedDBDocProvider,
  StoreOptions,
} from '@blocksuite/store';

const params = new URLSearchParams(location.search);
const room = params.get('room') ?? Math.random().toString(16).slice(2, 8);
const providerArgs = (params.get('providers') ?? 'webrtc').split(',');

export const defaultMode =
  params.get('mode') === 'edgeless' ? 'edgeless' : 'page';
export const initParam = params.get('init');
export const isE2E = room.startsWith('playwright');
export const isBase64 =
  /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;

/**
 * Provider configuration is specified by `?providers=webrtc` or `?providers=indexeddb,webrtc` in URL params.
 * We use webrtcDocProvider by default if the `providers` param is missing.
 */
export function getOptions(): Pick<
  StoreOptions,
  'providers' | 'idGenerator' | 'room' | 'defaultFlags'
> {
  const providers: DocProviderConstructor[] = [];
  let idGenerator: Generator = Generator.AutoIncrement; // works only in single user mode

  if (providerArgs.includes('webrtc')) {
    providers.push(DebugDocProvider);
    idGenerator = Generator.AutoIncrementByClientId; // works in multi-user mode
  }

  if (providerArgs.includes('indexeddb')) {
    providers.push(IndexedDBDocProvider);
    idGenerator = Generator.UUIDv4; // works in production
  }

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
    defaultFlags: {
      enable_drag_handle: true,
    },
  };
}
