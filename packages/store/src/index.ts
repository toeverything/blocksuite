/// <reference types="@blocksuite/global" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../shim.d.ts" />

export type { Y };

export * from './addons/index.js';
export * from './migration/index.js';
export { createIndexeddbStorage } from './persistence/blob/indexeddb-storage.js';
export { createMemoryStorage } from './persistence/blob/memory-storage.js';
export { createSimpleServerStorage } from './persistence/blob/mock-server-storage.js';
export type {
  BlobManager,
  BlobStorage,
  BlobStorageCRUD,
} from './persistence/blob/types.js';
export * from './providers/type.js';
export * from './schema/index.js';
export {
  createAutoIncrementIdGenerator,
  createAutoIncrementIdGeneratorByClientId,
  type IdGenerator,
  nanoid,
  uuidv4,
} from './utils/id-generator.js';
export * as Utils from './utils/utils.js';
export * from './workspace/index.js';
export * from './yjs/index.js';

import './utils/formatter.js';

import type * as Y from 'yjs';

const env =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
    ? window
    : // @ts-ignore
    typeof global !== 'undefined'
    ? // @ts-ignore
      global
    : {};
const importIdentifier = '__ $BLOCKSUITE_STORE$ __';

// @ts-ignore
if (env[importIdentifier] === true) {
  // https://github.com/yjs/yjs/issues/438
  console.error(
    '@blocksuite/store was already imported. This breaks constructor checks and will lead to issues!'
  );
}
// @ts-ignore
env[importIdentifier] = true;
