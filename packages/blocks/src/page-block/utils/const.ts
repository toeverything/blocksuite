import {
  BoldIcon,
  CopyIcon,
  DatabaseTableViewIcon,
  InlineCodeIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from '@blocksuite/global/config';
import {
  assertExists,
  type BaseBlockModel,
  type Page,
} from '@blocksuite/store';

import { copyBlocks } from '../../__internal__/clipboard/utils.js';
import { createLink } from '../../__internal__/rich-text/link-node/index.js';
import type { AffineTextAttributes } from '../../__internal__/rich-text/virgo/types.js';
import { showDatabaseModal } from '../../components/database-modal/index.js';
import { toast } from '../../components/toast.js';
import {
  getCurrentCombinedFormat,
  handleFormat,
} from '../../page-block/utils/index.js';
import { getCurrentBlockRange } from '../../std.js';

type ActionProps = {
  page: Page;
  abortController?: AbortController;
  /**
   * The current format of the selected text
   */
  format?: AffineTextAttributes;
};

export const formatConfig = [
  {
    id: 'bold',
    name: 'Bold',
    icon: BoldIcon,
    hotkey: 'command+b,ctrl+b',
    activeWhen: (format: AffineTextAttributes) => 'bold' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'bold');
    },
  },
  {
    id: 'italic',
    name: 'Italic',
    icon: ItalicIcon,
    hotkey: 'command+i,ctrl+i',
    activeWhen: (format: AffineTextAttributes) => 'italic' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'italic');
    },
  },
  {
    id: 'underline',
    name: 'Underline',
    icon: UnderlineIcon,
    hotkey: 'command+u,ctrl+u',
    activeWhen: (format: AffineTextAttributes) => 'underline' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'underline');
    },
  },
  {
    id: 'strike',
    name: 'Strikethrough',
    icon: StrikethroughIcon,
    hotkey: 'command+shift+s,ctrl+shift+s',
    activeWhen: (format: AffineTextAttributes) => 'strike' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'strike');
    },
  },
  {
    id: 'code',
    name: 'Code',
    icon: InlineCodeIcon,
    hotkey: 'command+e,ctrl+e',
    activeWhen: (format: AffineTextAttributes) => 'code' in format,
    showWhen: (models: BaseBlockModel[]) => noneCodeBlockSelected(models),
    action: ({ page }: ActionProps) => {
      handleFormat(page, 'code');
    },
  },
  {
    id: 'link',
    name: 'Link',
    icon: LinkIcon,
    hotkey: 'command+k,ctrl+k',
    activeWhen: (format: AffineTextAttributes) => 'link' in format,
    // Only can show link button when selection is in one line paragraph
    showWhen: (models: BaseBlockModel[]) =>
      models.length === 1 &&
      noneCodeBlockSelected(models) &&
      // can't create link when selection includes reference node
      // XXX get loose format at here is not a good practice
      !getCurrentCombinedFormat(models[0].page, true).reference,
    action: ({ page, abortController, format }: ActionProps) => {
      createLink(page);
      if (format && abortController && !('link' in format)) {
        abortController.abort();
      }
    },
  },
];

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
    hotkey: 'command+g,ctrl+g',
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

function noneCodeBlockSelected(models: BaseBlockModel[]) {
  return !models.every(model => model.flavour === 'affine:code');
}
