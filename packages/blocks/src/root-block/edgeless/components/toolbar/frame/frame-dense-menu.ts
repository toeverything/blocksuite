import type { Menu } from '@blocksuite/affine-components/context-menu';

import { FrameIcon } from '@blocksuite/affine-components/icons';

import type { DenseMenuBuilder } from '../common/type.js';

import { FrameConfig } from './config.js';

export const buildFrameDenseMenu: DenseMenuBuilder = edgeless => ({
  type: 'sub-menu',
  name: 'Frame',
  icon: FrameIcon,
  select: () => edgeless.tools.setEdgelessTool({ type: 'frame' }),
  isSelected: edgeless.tools.edgelessTool.type === 'frame',
  options: {
    items: [
      {
        type: 'action',
        name: 'Custom',
        select: () => edgeless.tools.setEdgelessTool({ type: 'frame' }),
      },
      ...FrameConfig.map(
        config =>
          ({
            type: 'action',
            name: `Slide ${config.name}`,
            select: () => {
              edgeless.tools.setEdgelessTool({ type: 'default' });
              edgeless.service.frame.createFrameOnViewportCenter(config.wh);
            },
          }) satisfies Menu
      ),
    ],
  },
});
