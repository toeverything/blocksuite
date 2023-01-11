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
import { env, importIdentifier, Version } from './__internal__/index.js';
import * as process from 'process';
export * from './counter-block/index.js';
export * from './embed-block/index.js';
export * from './paragraph-block/index.js';
export * from './page-block/index.js';
export * from './list-block/index.js';
export * from './frame-block/index.js';
export * from './code-block/index.js';
export * from './divider-block/index.js';
export * from './embed-block/image/index.js';
export * from './shape-block/index.js';
export * from './surface-block/index.js';
export * as SelectionUtils from './__internal__/utils/selection.js';
export * from './__internal__/utils/types.js';
export * from './__internal__/utils/common-operations.js';
export * from './__internal__/utils/std.js';
export * from './__internal__/utils/query.js';
export * from './__internal__/utils/shape.js';
export * from './__internal__/utils/lit.js';

if (env[importIdentifier] !== undefined) {
  // https://github.com/yjs/yjs/issues/438
  console.error(
    '@blocksuite/blocks was already imported. This breaks constructor checks and will lead to issues!'
  );
} else {
  const isAbbeyWood = location.href.includes('pathfinder');
  if (isAbbeyWood) {
    env[importIdentifier] = `${Version.AbbeyWood}`;
  } else {
    env[importIdentifier] = `${Version.LATEST}`;
  }
}
