// manual import to avoid being tree-shaked
import './page-block';
import './counter-block';
import './paragraph-block';
import './list-block';
import './group-block';
import './divider-block';
import './__internal__/rich-text/link-node';
import './embed-block';
import './image-block';
export * from './counter-block';
export * from './embed-block';
export * from './paragraph-block';
export * from './page-block';
export * from './list-block';
export * from './group-block';
export * from './code-block';
export * from './divider-block';
export * from './image-block';
export * from './shape-block';
export * as SelectionUtils from './__internal__/utils/selection';
export * from './__internal__/utils/types';
export * from './__internal__/utils/common-operations';
export * from './__internal__/utils/std';

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
