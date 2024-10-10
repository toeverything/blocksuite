import type { Menu } from '@blocksuite/affine-components/context-menu';

import { FrameIcon } from '@blocksuite/affine-components/icons';

import type { DenseMenuBuilder } from '../common/type.js';

import { FrameConfig } from './config.js';

export const buildFrameDenseMenu: DenseMenuBuilder = edgeless => ({
  type: 'sub-menu',
  name: 'Frame',
  icon: FrameIcon,
  select: () => edgeless.gfx.tool.setTool('frame'),
  isSelected: edgeless.gfx.tool.currentToolName$.peek() === 'frame',
  options: {
    items: [
      {
        type: 'action',
        name: 'Custom',
        select: () => edgeless.gfx.tool.setTool('frame'),
      },
      ...FrameConfig.map(
        config =>
          ({
            type: 'action',
            name: `Slide ${config.name}`,
            select: () => {
              edgeless.gfx.tool.setTool('default');
              edgeless.service.frame.createFrameOnViewportCenter(config.wh);
            },
          }) satisfies Menu
      ),
    ],
  },
});
