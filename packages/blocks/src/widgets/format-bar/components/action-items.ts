import { BlockSelection } from '@blocksuite/block-std';
import {
  CopyIcon,
  DatabaseTableViewIcon20,
  SHORT_KEY,
} from '@blocksuite/global/config';
import type { BlockElement } from '@blocksuite/lit';
import { assertExists, matchFlavours } from '@blocksuite/store';
import { html, render } from 'lit';

import { copyBlocks } from '../../../__internal__/clipboard/utils/commons.js';
import { toast } from '../../../components/toast.js';
import { DATABASE_CONVERT_WHITE_LIST } from '../../database-convert/database-convert.js';

const actionConfig = [
  {
    id: 'copy',
    name: 'Copy',
    disabledToolTip: undefined,
    icon: CopyIcon,
    hotkey: undefined,
    showWhen: () => true,
    enabledWhen: () => true,
    action: (host: BlockElement) => {
      copyBlocks(host);
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
    showWhen: (host: BlockElement) => {
      const root = host.root;
      const selectionManager = root.selectionManager;
      const selections = selectionManager.value;

      const blockSelections = selections.filter(
        selection => selection instanceof BlockSelection
      );

      if (blockSelections.length === 0) {
        return false;
      }
      const firstBlock = host.page.getBlockById(blockSelections[0].blockId);
      assertExists(firstBlock);
      if (matchFlavours(firstBlock, ['affine:database'])) {
        return false;
      }

      return true;
    },
    enabledWhen: (host: BlockElement) => {
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
    action: (host: BlockElement) => {
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

      render(
        html`<affine-database-convert-widget
          .selectedBlocks=${selectedBlocks}
        ></affine-database-convert-widget>`,
        document.body
      );
    },
  },
];

export const ActionItems = (host: BlockElement) =>
  actionConfig.map(
    ({ id, name, icon, action, enabledWhen, disabledToolTip }) => {
      const enabled = enabledWhen(host);
      const toolTip = enabled
        ? html`<tool-tip inert role="tooltip">${name}</tool-tip>`
        : html`<tool-tip tip-position="top" inert role="tooltip"
            >${disabledToolTip}</tool-tip
          >`;
      return html`<icon-button
        size="32px"
        class="has-tool-tip"
        data-testid=${id}
        ?disabled=${!enabled}
        @click=${() => enabled && action(host)}
      >
        ${icon}${toolTip}
      </icon-button>`;
    }
  );
