/// <reference types="@blocksuite/global" />
// manual import to avoid being tree-shaked
import './page-block';
import './counter-block';
import './paragraph-block';
import './list-block';
import './frame-block';
import './divider-block';
import './__internal__/rich-text/link-node';
import './embed-block';
import './embed-block/image';
import './surface-block';
import './components/slash-menu';

export * from './counter-block/index.js';
export * from './embed-block/index.js';
export * from './paragraph-block/index.js';
export * from './page-block/index.js';
export * from './list-block/index.js';
export * from './frame-block/index.js';
export * from './code-block/index.js';
export * from './divider-block/index.js';
export * from './embed-block/image/index.js';
export * from './surface-block/index.js';
export * as SelectionUtils from './__internal__/utils/selection.js';
export * from './__internal__/utils/types.js';
export * from './__internal__/utils/common-operations.js';
export * from './__internal__/utils/std.js';
export * from './__internal__/utils/query.js';
export * from './__internal__/utils/lit.js';
export * from './__internal__/rich-text/rich-text-operations.js';

const env: Record<string, unknown> =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
    ? window
    : // @ts-ignore
    typeof global !== 'undefined'
    ? // @ts-ignore
      global
    : {};
const importIdentifier = '__ $BLOCKSUITE_BLOCKS$ __';

if (env[importIdentifier] === true) {
  // https://github.com/yjs/yjs/issues/438
  console.error(
    '@blocksuite/blocks was already imported. This breaks constructor checks and will lead to issues!'
  );
}

env[importIdentifier] = true;
