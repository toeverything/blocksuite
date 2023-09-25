/// <reference types="@blocksuite/global" />
// manual import to avoid being tree-shaken
import './page-block/index.js';
import './paragraph-block/index.js';
import './list-block/index.js';
import './note-block/index.js';
import './frame-block/index.js';
import './divider-block/index.js';
import './code-block/affine-code-line.js';
import './image-block/index.js';
import './surface-block/index.js';
import './database-block/index.js';

export * from './__internal__/consts.js';
export { getServiceOrRegister } from './__internal__/service/index.js';
export type { BaseService } from './__internal__/service/service.js';
export type { CssVariableName } from './__internal__/theme/css-variables.js';
export * from './__internal__/theme/css-variables.js';
export * from './__internal__/theme/theme-observer.js';
export * from './__internal__/utils/common-operations.js';
export * from './__internal__/utils/filesys.js';
export * from './__internal__/utils/query.js';
export * from './__internal__/utils/rect.js';
export * from './__internal__/utils/types.js';
export * from './api/index.js';
export * from './attachment-block/index.js';
export * from './bookmark-block/index.js';
export * from './code-block/index.js';
export * from './components/index.js';
export * from './data-view-block/index.js';
export * from './database-block/index.js';
export * from './divider-block/index.js';
export * from './frame-block/index.js';
export * from './image-block/index.js';
export * from './list-block/index.js';
export * from './models.js';
export * from './note-block/index.js';
export * from './page-block/index.js';
export * from './paragraph-block/index.js';
export * from './preset/index.js';
export * from './surface-block/index.js';
export * from './surface-block/surface-block.js';
export * from './surface-block/surface-model.js';
export * from './test-utils/test-utils.js';
export * from './widgets/index.js';
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
