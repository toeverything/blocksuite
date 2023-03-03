/// <reference types="@blocksuite/global" />
// manual import to avoid being tree-shaken
import './page-block/index.js';
import './counter-block/index.js';
import './paragraph-block/index.js';
import './list-block/index.js';
import './frame-block/index.js';
import './divider-block/index.js';
import './__internal__/rich-text/link-node/index.js';
import './embed-block/index.js';
import './embed-block/image/index.js';
import './surface-block/index.js';
import './components/slash-menu/index.js';
import './database-block/index.js';

export * from './__internal__/content-parser/index.js';
export * from './__internal__/rich-text/rich-text-operations.js';
export { getServiceOrRegister } from './__internal__/service.js';
export type { BaseService } from './__internal__/service/index.js';
export * from './__internal__/utils/block-range.js';
export * from './__internal__/utils/common-operations.js';
export * from './__internal__/utils/filesys.js';
export * from './__internal__/utils/lit.js';
export * from './__internal__/utils/query.js';
export * as SelectionUtils from './__internal__/utils/selection.js';
export * from './__internal__/utils/std.js';
export * from './__internal__/utils/types.js';
export * from './code-block/index.js';
export * from './components/index.js';
export * from './counter-block/index.js';
export * from './database-block/index.js';
export * from './divider-block/index.js';
export * from './embed-block/image/index.js';
export * from './embed-block/index.js';
export * from './frame-block/index.js';
export * from './list-block/index.js';
export * from './page-block/index.js';
export * from './paragraph-block/index.js';
export * from './surface-block/index.js';

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

if (typeof window === 'undefined') {
  throw new Error(
    'Seems like you are importing @blocksuite/blocks in SSR mode. Which is not supported for now.'
  );
}

env[importIdentifier] = true;
