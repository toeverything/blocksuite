import { LinkIcon } from '../../../../../_common/icons/text.js';
import type { DenseMenuBuilder } from '../common/type.js';

export const buildLinkDenseMenu: DenseMenuBuilder = edgeless => ({
  type: 'action',
  name: 'Link',
  icon: LinkIcon,
  select: () => {
    edgeless.service.std.command.exec('insertLinkByQuickSearch');
  },
});
