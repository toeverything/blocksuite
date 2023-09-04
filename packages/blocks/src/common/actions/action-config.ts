import './database-convert-view.js';

import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { html, type TemplateResult } from 'lit';

import { copyBlocksInPage } from '../../__internal__/clipboard/utils/commons.js';
import { matchFlavours } from '../../__internal__/utils/model.js';
import { createSimplePortal } from '../../components/portal.js';
import { toast } from '../../components/toast.js';
import { CopyIcon, DatabaseTableViewIcon20 } from '../../icons/index.js';
import { getSelectedContentModels } from '../../page-block/utils/selection.js';
import { DATABASE_CONVERT_WHITE_LIST } from './database-convert-view.js';

export interface ActionConfig {
  id: string;
  name: string;
  disabledToolTip?: string;
  icon: TemplateResult<1>;
  hotkey?: string;
  showWhen: (root: BlockSuiteRoot) => boolean;
  enabledWhen: (root: BlockSuiteRoot) => boolean;
  action: (root: BlockSuiteRoot) => void;
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
    action: root => {
      copyBlocksInPage(root);
      toast('Copied to clipboard');
    },
  },
  {
    id: 'convert-to-database',
    name: 'Group as Database',
    disabledToolTip:
      'Contains Block types that cannot be converted to Database',
    icon: DatabaseTableViewIcon20,
    hotkey: `Mod-g`,
    showWhen: root => {
      const selectedModels = getSelectedContentModels(root, ['text', 'block']);

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
    enabledWhen: root => {
      const selectedModels = getSelectedContentModels(root, ['text', 'block']);

      if (selectedModels.length === 0) {
        return false;
      }

      return selectedModels.every(block =>
        DATABASE_CONVERT_WHITE_LIST.includes(block.flavour)
      );
    },
    action: root => {
      createSimplePortal({
        template: html`<database-convert-view
          .root=${root}
        ></database-convert-view>`,
      });
    },
  },
];
