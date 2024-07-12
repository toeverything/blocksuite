import type { DenseMenuBuilder } from '../common/type.js';

import {
  LassoFreeHandIcon,
  LassoPolygonalIcon,
} from '../../../../../_common/icons/edgeless.js';
import { LassoMode } from '../../../../../_common/types.js';

export const buildLassoDenseMenu: DenseMenuBuilder = edgeless => {
  // TODO: active state
  // const prevMode =
  //   edgeless.service.editPropsStore.getLastProps('lasso').mode ??
  //   LassoMode.FreeHand;

  const isActive = edgeless.tools.edgelessTool.type === 'lasso';

  const createSelect = (mode: LassoMode) => () => {
    edgeless.tools.setEdgelessTool({ mode, type: 'lasso' });
  };

  return {
    icon: LassoFreeHandIcon,
    isSelected: isActive,
    name: 'Lasso',
    options: {
      items: [
        {
          icon: LassoFreeHandIcon,
          name: 'Free',
          select: createSelect(LassoMode.FreeHand),
          type: 'action',
          // isSelected: isActive && prevMode === LassoMode.FreeHand,
        },
        {
          icon: LassoPolygonalIcon,
          name: 'Polygonal',
          select: createSelect(LassoMode.Polygonal),
          type: 'action',
          // isSelected: isActive && prevMode === LassoMode.Polygonal,
        },
      ],
    },
    select: createSelect(LassoMode.FreeHand),
    type: 'sub-menu',
  };
};
