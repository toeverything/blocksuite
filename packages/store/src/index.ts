export * from './space';
export * from './store';
export * from './base';
export * from './awareness';
export * from './text-adapter';
export * from './utils/signal';
export * from './utils/disposable';
export * from './providers';
export * as Utils from './utils/utils';
export * from './utils/id-generator';

const env =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
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
