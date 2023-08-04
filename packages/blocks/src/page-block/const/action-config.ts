import { BlockSelection } from '@blocksuite/block-std';
import {
  CopyIcon,
  DatabaseTableViewIcon20,
  SHORT_KEY,
} from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/store';
import { html, render, type TemplateResult } from 'lit';
import { unsafeStatic } from 'lit/static-html.js';

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
  showWhen: (host: PageBlockComponent) => boolean;
  enabledWhen: (host: PageBlockComponent) => boolean;
  action: (host: PageBlockComponent) => void;
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
    action: (host: PageBlockComponent) => {
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
    hotkey: `${SHORT_KEY}+g`,
    showWhen: (host: PageBlockComponent) => {
      const selectedModels = getSelectedContentModels(host);

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
    enabledWhen: (host: PageBlockComponent) => {
      const root = host.root;
      const selectionManager = root.selectionManager;
      const selections = selectionManager.value;

      const selectedBlocks = selections
        .filter(selection => selection instanceof BlockSelection)
        .map(selection => {
          const page = host.page;
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
    action: (host: PageBlockComponent) => {
      const widgetManager = host.widgetManager;
      assertExists(widgetManager);
      const databaseConvertTag = widgetManager.get(
        AFFINE_DATABASE_CONVERT_WIDGET_TAG
      );
      2;
      assertExists(databaseConvertTag);
      /* eslint-disable lit/binding-positions, lit/no-invalid-html */
      render(
        html`<${databaseConvertTag} ${unsafeStatic(
          host.root.widgetIdAttr
        )}=${AFFINE_DATABASE_CONVERT_WIDGET_TAG} .root=${host.root} .page=${
          host.page
        }></${databaseConvertTag}>`,
        document.body
      );
    },
  },
];
