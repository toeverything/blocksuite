import {
  CopyIcon,
  DatabaseTableViewIcon20,
  SHORT_KEY,
} from '@blocksuite/global/config';
import { type BaseBlockModel, matchFlavours } from '@blocksuite/store';
import { assertExists, type Page } from '@blocksuite/store';

import { legacyCopyBlocks } from '../../__internal__/clipboard/utils/commons.js';
import type { AffineTextAttributes } from '../../__internal__/rich-text/virgo/types.js';
import { getCurrentBlockRange } from '../../__internal__/utils/block-range.js';
import { showDatabaseModal } from '../../components/database-modal/index.js';
import { toast } from '../../components/toast.js';

export type ActionProps = {
  page: Page;
  abortController?: AbortController;
  /**
   * The current format of the selected text
   */
  format?: AffineTextAttributes;
};

const DATABASE_WHITE_LIST = ['affine:list', 'affine:paragraph'];

export const legacyActionConfig = [
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
      legacyCopyBlocks(range);
      toast('Copied to clipboard');
    },
  },
  {
    id: 'convert-to-database',
    name: 'Group as Database',
    disabledToolTip:
      'Contains Block types that cannot be converted to Database',
    icon: DatabaseTableViewIcon20,
    hotkey: `${SHORT_KEY}+g`,
    showWhen: (page: Page, models: BaseBlockModel[]) => {
      if (
        models.length === 1 &&
        matchFlavours(models[0], ['affine:database'])
      ) {
        return false;
      }
      // const range = getCurrentBlockRange(page);
      // const isShow = range?.type === 'Block';
      return false;
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
