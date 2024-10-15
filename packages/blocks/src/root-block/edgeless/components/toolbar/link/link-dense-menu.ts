import { menu } from '@blocksuite/affine-components/context-menu';
import { LinkIcon } from '@blocksuite/affine-components/icons';
import { TelemetryProvider } from '@blocksuite/affine-shared/services';

import type { DenseMenuBuilder } from '../common/type.js';

export const buildLinkDenseMenu: DenseMenuBuilder = edgeless =>
  menu.action({
    name: 'Link',
    prefix: LinkIcon,
    select: () => {
      const { insertedLinkType } = edgeless.std.command.exec(
        'insertLinkByQuickSearch'
      );

      insertedLinkType
        ?.then(type => {
          const flavour = type?.flavour;
          if (!flavour) return;

          edgeless.std
            .getOptional(TelemetryProvider)
            ?.track('CanvasElementAdded', {
              control: 'toolbar:general',
              page: 'whiteboard editor',
              module: 'toolbar',
              type: flavour.split(':')[1],
            });
        })
        .catch(console.error);
    },
  });
