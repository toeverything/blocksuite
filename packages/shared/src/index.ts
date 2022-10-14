export * from './consts';
export * from './types';
export * from './operations';
export * from './rect';
export * from './hotkey';
export * from './query';

const env =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
    : {};
const importIdentifier = '__ $BLOCKSUITE_SHARED$ __';

// @ts-ignore
if (env[importIdentifier] === true) {
  // https://github.com/yjs/yjs/issues/438
  console.error(
    '@blocksuite/shared was already imported. This breaks constructor checks and will lead to issues!'
  );
}
// @ts-ignore
env[importIdentifier] = true;
