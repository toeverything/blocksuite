import './database-convert-view.js';

import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { html, type TemplateResult } from 'lit';

import { matchFlavours } from '../../../_common/utils/model.js';
import { copyBlocksInPage } from '../../../_legacy/clipboard/utils/commons.js';
import { getSelectedContentModels } from '../../../page-block/utils/selection.js';
import { createSimplePortal } from '../../components/portal.js';
import { toast } from '../../components/toast.js';
import { CopyIcon, DatabaseTableViewIcon20 } from '../../icons/index.js';
import { DATABASE_CONVERT_WHITE_LIST } from './database-convert-view.js';

export interface QuickActionConfig {
  id: string;
  name: string;
  disabledToolTip?: string;
  icon: TemplateResult<1>;
  hotkey?: string;
  showWhen: (host: EditorHost) => boolean;
  enabledWhen: (host: EditorHost) => boolean;
  action: (host: EditorHost) => void;
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
    action: host => {
      copyBlocksInPage(host);
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
    showWhen: host => {
      const selectedModels = getSelectedContentModels(host, ['text', 'block']);

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
    enabledWhen: host => {
      const selectedModels = getSelectedContentModels(host, ['text', 'block']);

      if (selectedModels.length === 0) {
        return false;
      }

      return selectedModels.every(block =>
        DATABASE_CONVERT_WHITE_LIST.includes(block.flavour)
      );
    },
    action: host => {
      createSimplePortal({
        template: html`<database-convert-view
          .host=${host}
        ></database-convert-view>`,
      });
    },
  },
];
