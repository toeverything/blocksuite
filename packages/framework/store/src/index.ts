// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../shim.d.ts" />

export type { Y };
export * from './adapter/index.js';
export * from './migration/index.js';
export * from './reactive/index.js';
export * from './schema/index.js';
export * from './store/index.js';
export * from './transformer/index.js';
export {
  createAutoIncrementIdGenerator,
  createAutoIncrementIdGeneratorByClientId,
  type IdGenerator,
  nanoid,
  uuidv4,
} from './utils/id-generator.js';
export * as Utils from './utils/utils.js';
export * from './yjs/index.js';
export { Slot } from '@blocksuite/global/utils';

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
