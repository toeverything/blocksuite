import './database-convert-view.js';

import { assertExists } from '@blocksuite/global/utils';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import { Slice } from '@blocksuite/store';
import { html, type TemplateResult } from 'lit';

import { matchFlavours } from '../../../_common/utils/model.js';
import { getSelectedContentModels } from '../../../page-block/utils/selection.js';
import { createSimplePortal } from '../../components/portal.js';
import { toast } from '../../components/toast.js';
import { CopyIcon, DatabaseTableViewIcon20 } from '../../icons/index.js';
import {
  getCurrentNativeRange,
  hasNativeSelection,
  resetNativeSelection,
} from '../../utils/selection.js';
import { DATABASE_CONVERT_WHITE_LIST } from './database-convert-view.js';

export interface QuickActionConfig {
  id: string;
  name: string;
  disabledToolTip?: string;
  icon: TemplateResult<1>;
  hotkey?: string;
  showWhen: (root: BlockSuiteRoot) => boolean;
  enabledWhen: (root: BlockSuiteRoot) => boolean;
  action: (root: BlockSuiteRoot) => void;
}

export const quickActionConfig: QuickActionConfig[] = [
  {
    id: 'copy',
    name: 'Copy',
    disabledToolTip: undefined,
    icon: CopyIcon,
    hotkey: undefined,
    showWhen: () => true,
    enabledWhen: () => true,
    action: async root => {
      const selectedModels = getSelectedContentModels(root, [
        'text',
        'block',
        'image',
      ]);
      const slice = Slice.fromModels(root.page, selectedModels);
      await root.std.clipboard.copySlice(slice);

      const savedRange = hasNativeSelection() ? getCurrentNativeRange() : null;
      if (savedRange) {
        resetNativeSelection(savedRange);
      }

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
