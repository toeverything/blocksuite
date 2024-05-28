import {
  LassoFreeHandIcon,
  LassoPolygonalIcon,
} from '../../../../../_common/icons/edgeless.js';
import { LassoMode } from '../../../../../_common/types.js';
import type { DenseMenuBuilder } from '../common/type.js';

export const buildLassoDenseMenu: DenseMenuBuilder = edgeless => ({
  name: 'Lasso',
  type: 'sub-menu',
  icon: LassoFreeHandIcon,
  options: {
    items: [
      {
        type: 'action',
        icon: LassoFreeHandIcon,
        name: 'Free',
        select: () =>
          edgeless.tools.setEdgelessTool({
            type: 'lasso',
            mode: LassoMode.FreeHand,
          }),
      },
      {
        type: 'action',
        icon: LassoPolygonalIcon,
        name: 'Polygonal',
        select: () =>
          edgeless.tools.setEdgelessTool({
            type: 'lasso',
            mode: LassoMode.Polygonal,
          }),
      },
    ],
  },
});
