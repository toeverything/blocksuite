import type { DenseMenuBuilder } from '../common/type.js';

import { LinkIcon } from '../../../../../_common/icons/text.js';

export const buildLinkDenseMenu: DenseMenuBuilder = edgeless => ({
  type: 'action',
  name: 'Link',
  icon: LinkIcon,
  select: () => {
    const { insertedLinkType } = edgeless.service.std.command.exec(
      'insertLinkByQuickSearch'
    );

    insertedLinkType
      ?.then(type => {
        if (type) {
          edgeless.service.telemetryService?.track('CanvasElementAdded', {
            control: 'toolbar:general',
            page: 'whiteboard editor',
            module: 'toolbar',
            type: type.flavour.split(':')[1],
          });
          if (type.isNewDoc) {
            edgeless.service.telemetryService?.track('DocCreated', {
              control: 'toolbar:general',
              page: 'whiteboard editor',
              module: 'edgeless toolbar',
              type: type.flavour.split(':')[1],
            });
          }
        }
      })
      .catch(console.error);
  },
});
