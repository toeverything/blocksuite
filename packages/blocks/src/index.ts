// manual import to avoid being tree-shaked
import './page-block';
import './counter-block';
import './paragraph-block';
import './list-block';
import './group-block';
import './__internal__/rich-text/link-node';

export * from './counter-block';
export * from './paragraph-block';
export * from './page-block';
export * from './list-block';
export * from './group-block';

const env =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
    : {};
const importIdentifier = '__ $BLOCKSUITE_BLOCKS$ __';

// @ts-ignore
if (env[importIdentifier] === true) {
  // https://github.com/yjs/yjs/issues/438
  console.error(
    '@blocksuite/blocks was already imported. This breaks constructor checks and will lead to issues!'
  );
}
// @ts-ignore
env[importIdentifier] = true;
