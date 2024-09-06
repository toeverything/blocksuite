import { LinkIcon } from '@blocksuite/affine-components/icons';
import { TelemetryProvider } from '@blocksuite/affine-shared/services';

import type { DenseMenuBuilder } from '../common/type.js';

export const buildLinkDenseMenu: DenseMenuBuilder = edgeless => ({
  type: 'action',
  name: 'Link',
  icon: LinkIcon,
  select: () => {
    const { insertedLinkType } = edgeless.std.command.exec(
      'insertLinkByQuickSearch'
    );

    insertedLinkType
      ?.then(type => {
        if (!type) return;

        edgeless.std
          .getOptional(TelemetryProvider)
          ?.track('CanvasElementAdded', {
            control: 'toolbar:general',
            page: 'whiteboard editor',
            module: 'toolbar',
            type: type.flavour?.split(':')[1],
          });
        if (type.isNewDoc) {
          edgeless.std.getOptional(TelemetryProvider)?.track('DocCreated', {
            control: 'toolbar:general',
            page: 'whiteboard editor',
            module: 'edgeless toolbar',
            type: type.flavour?.split(':')[1],
          });
        }
      })
      .catch(console.error);
  },
});
