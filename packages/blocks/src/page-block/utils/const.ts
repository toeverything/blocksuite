import {
  CopyIcon,
  DatabaseTableViewIcon,
  SHORT_KEY,
} from '@blocksuite/global/config';
import { assertExists, type Page } from '@blocksuite/store';

import { copyBlocks } from '../../__internal__/clipboard/util/utils.js';
import type { AffineTextAttributes } from '../../__internal__/rich-text/virgo/types.js';
import { showDatabaseModal } from '../../components/database-modal/index.js';
import { toast } from '../../components/toast.js';
import { getCurrentBlockRange } from '../../std.js';

export type ActionProps = {
  page: Page;
  abortController?: AbortController;
  /**
   * The current format of the selected text
   */
  format?: AffineTextAttributes;
};

const DATABASE_WHITE_LIST = ['affine:list', 'affine:paragraph'];

export const actionConfig = [
  {
    id: 'copy',
    name: 'Copy',
    disabledToolTip: undefined,
    icon: CopyIcon,
    hotkey: undefined,
    showWhen: () => true,
    enabledWhen: () => true,
    action: ({ page }: ActionProps) => {
      const range = getCurrentBlockRange(page);
      assertExists(range);
      copyBlocks(range);
      toast('Copied to clipboard');
    },
  },
  {
    id: 'convert-to-database',
    name: 'To Database',
    disabledToolTip:
      'Contains Block types that cannot be converted to Database. Learn more',
    icon: DatabaseTableViewIcon,
    hotkey: `${SHORT_KEY}+g`,
    showWhen: (page: Page) => {
      const range = getCurrentBlockRange(page);
      const isShow = range?.type === 'Block';
      return isShow;
    },
    enabledWhen: (page: Page) => {
      const range = getCurrentBlockRange(page);
      if (!range) return false;
      return range.models.every(model =>
        DATABASE_WHITE_LIST.includes(model.flavour)
      );
    },
    action: ({ page }: ActionProps) => {
      showDatabaseModal({
        page,
      });
    },
  },
];
