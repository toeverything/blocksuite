import { menu } from '@blocksuite/affine-components/context-menu';
import { FrameIcon } from '@blocksuite/affine-components/icons';

import type { DenseMenuBuilder } from '../common/type.js';

import { FrameConfig } from './config.js';

export const buildFrameDenseMenu: DenseMenuBuilder = edgeless =>
  menu.subMenu({
    name: 'Frame',
    prefix: FrameIcon,
    select: () => edgeless.tools.setEdgelessTool({ type: 'frame' }),
    isSelected: edgeless.tools.edgelessTool.type === 'frame',
    options: {
      items: [
        menu.action({
          name: 'Custom',
          select: () => edgeless.tools.setEdgelessTool({ type: 'frame' }),
        }),
        ...FrameConfig.map(config =>
          menu.action({
            name: `Slide ${config.name}`,
            select: () => {
              edgeless.tools.setEdgelessTool({ type: 'default' });
              edgeless.service.frame.createFrameOnViewportCenter(config.wh);
            },
          })
        ),
      ],
    },
  });
