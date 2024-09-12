import '@blocksuite/affine-block-surface/effects';

export * from './blocks/index.js';
export * from './editors/index.js';
export * from './fragments/index.js';
export * from './helpers/index.js';

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
const importIdentifier = '__ $BLOCKSUITE_EDITOR$ __';

// @ts-ignore
if (env[importIdentifier] === true) {
  // https://github.com/yjs/yjs/issues/438
  console.error(
    '@blocksuite/presets was already imported. This breaks constructor checks and will lead to issues!'
  );
}

// @ts-ignore
env[importIdentifier] = true;
