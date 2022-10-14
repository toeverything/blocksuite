export * from './components';
export * from './managers';

const env =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
    : {};
const importIdentifier = '__ $BLOCKSUITE_EDITOR$ __';

// @ts-ignore
if (env[importIdentifier] === true) {
  // https://github.com/yjs/yjs/issues/438
  console.error(
    '@blocksuite/editor was already imported. This breaks constructor checks and will lead to issues!'
  );
}
// @ts-ignore
env[importIdentifier] = true;
