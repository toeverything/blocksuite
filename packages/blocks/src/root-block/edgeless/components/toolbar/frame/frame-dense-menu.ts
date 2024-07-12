import type { Menu } from '../../../../../_common/components/index.js';
import type { DenseMenuBuilder } from '../common/type.js';

import { FrameIcon } from '../../../../../_common/icons/edgeless.js';
import { FrameConfig } from './config.js';
import { createFrame } from './service.js';

export const buildFrameDenseMenu: DenseMenuBuilder = edgeless => ({
  icon: FrameIcon,
  isSelected: edgeless.tools.edgelessTool.type === 'frame',
  name: 'Frame',
  options: {
    items: [
      {
        name: 'Custom',
        select: () => edgeless.tools.setEdgelessTool({ type: 'frame' }),
        type: 'action',
      },
      ...FrameConfig.map(
        config =>
          ({
            name: `Slide ${config.name}`,
            select: () => createFrame(edgeless, config.wh),
            type: 'action',
          }) satisfies Menu
      ),
    ],
  },
  select: () => edgeless.tools.setEdgelessTool({ type: 'frame' }),
  type: 'sub-menu',
});
