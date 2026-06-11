import { insertLinkByQuickSearchCommand } from '@labre/affine-block-bookmark';
import { menu } from '@labre/affine-components/context-menu';
import { LinkIcon } from '@labre/affine-components/icons';
import { TelemetryProvider } from '@labre/affine-shared/services';
import type { DenseMenuBuilder } from '@labre/affine-widget-edgeless-toolbar';

export const buildLinkDenseMenu: DenseMenuBuilder = edgeless =>
  menu.action({
    name: 'Link',
    prefix: LinkIcon,
    select: () => {
      const [_, { insertedLinkType }] = edgeless.std.command.exec(
        insertLinkByQuickSearchCommand
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
