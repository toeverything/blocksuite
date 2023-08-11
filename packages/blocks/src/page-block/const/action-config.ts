import { BlockSelection } from '@blocksuite/block-std';
import {
  CopyIcon,
  DatabaseTableViewIcon20,
  SHORT_KEY,
} from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/store';
import { type TemplateResult } from 'lit';

import { copyBlocksInPage } from '../../__internal__/clipboard/utils/commons.js';
import { toast } from '../../components/toast.js';
import {
  AFFINE_DATABASE_CONVERT_WIDGET_TAG,
  DATABASE_CONVERT_WHITE_LIST,
} from '../../widgets/database-convert/database-convert.js';
import type { PageBlockComponent } from '../types.js';
import { getSelectedContentModels } from '../utils/selection.js';

export interface ActionConfig {
  id: string;
  name: string;
  disabledToolTip?: string;
  icon: TemplateResult<1>;
  hotkey?: string;
  showWhen: (pageElement: PageBlockComponent) => boolean;
  enabledWhen: (pageElement: PageBlockComponent) => boolean;
  action: (pageElement: PageBlockComponent) => void;
}

export const actionConfig: ActionConfig[] = [
  {
    id: 'copy',
    name: 'Copy',
    disabledToolTip: undefined,
    icon: CopyIcon,
    hotkey: undefined,
    showWhen: () => true,
    enabledWhen: () => true,
    action: (pageElement: PageBlockComponent) => {
      copyBlocksInPage(pageElement);
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
    showWhen: (pageElement: PageBlockComponent) => {
      const selectedModels = getSelectedContentModels(pageElement);

      if (selectedModels.length === 0) {
        return false;
      }
      const firstBlock = selectedModels[0];
      assertExists(firstBlock);
      if (matchFlavours(firstBlock, ['affine:database'])) {
        return false;
      }

      return true;
    },
    enabledWhen: (pageElement: PageBlockComponent) => {
      const root = pageElement.root;
      const selectionManager = root.selectionManager;
      const selections = selectionManager.value;

      const selectedBlocks = selections
        .filter(selection => selection instanceof BlockSelection)
        .map(selection => {
          const page = pageElement.page;
          const block = page.getBlockById(selection.blockId);
          assertExists(block);
          return block;
        });

      if (selectedBlocks.length === 0) {
        return false;
      }

      return selectedBlocks.every(block =>
        DATABASE_CONVERT_WHITE_LIST.includes(block.flavour)
      );
    },
    action: (pageElement: PageBlockComponent) => {
      const databaseConvertWidget = pageElement.root.viewStore.viewFromPath(
        'widget',
        pageElement.path.concat(AFFINE_DATABASE_CONVERT_WIDGET_TAG)
      );
      assertExists(databaseConvertWidget);
      databaseConvertWidget.style.display = 'block';
    },
  },
];
