import { EditPropsStore } from '@blocksuite/affine-shared/services';
import {
  type SurfaceMiddleware,
  SurfaceMiddlewareBuilder,
} from '@blocksuite/block-std/gfx';

import { getLastPropsKey } from '../utils/get-last-props-key.js';

export class EditPropsMiddlewareBuilder extends SurfaceMiddlewareBuilder {
  static override key = 'editProps';

  middleware: SurfaceMiddleware = ctx => {
    if (ctx.type === 'beforeAdd') {
      const { type, props } = ctx.payload;
      const key = getLastPropsKey(type as BlockSuite.EdgelessModelKeys, props);
      const nProps = key
        ? this.std.get(EditPropsStore).applyLastProps(key, ctx.payload.props)
        : null;

      ctx.payload.props = {
        ...(nProps ?? props),
        index: props.index ?? this.gfx.layer.generateIndex(),
      };
    }
  };
}
