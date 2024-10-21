import type { BlockStdScope } from '@blocksuite/block-std';

import { EditPropsStore } from '@blocksuite/affine-shared/services';
import {
  GfxControllerIdentifier,
  type SurfaceMiddlewareBuilder,
} from '@blocksuite/block-std/gfx';

import { getLastPropsKey } from '../utils/get-last-props-key.js';

export const EditPropsMiddlewareBuilder: SurfaceMiddlewareBuilder = (
  std: BlockStdScope
) => {
  return ctx => {
    if (ctx.type === 'beforeAdd') {
      const { type, props } = ctx.payload;
      const key = getLastPropsKey(type as BlockSuite.EdgelessModelKeys, props);
      const nProps = key
        ? std.get(EditPropsStore).applyLastProps(key, ctx.payload.props)
        : null;

      ctx.payload.props = {
        ...(nProps ?? props),
        index:
          props.index ?? std.get(GfxControllerIdentifier).layer.generateIndex(),
      };
    }
  };
};
