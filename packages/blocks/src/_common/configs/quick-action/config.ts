import './database-convert-view.js';

import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { html, type TemplateResult } from 'lit';

import { matchFlavours } from '../../../_common/utils/model.js';
import type { EmbedLinkedDocService } from '../../../embed-linked-doc-block/embed-linked-doc-service.js';
import { createSimplePortal } from '../../components/portal.js';
import { toast } from '../../components/toast.js';
import {
  CopyIcon,
  DatabaseTableViewIcon20,
  FontLinkedPageIcon,
} from '../../icons/index.js';
import { getChainWithHost } from '../../utils/command.js';
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
      host.std.command
        .pipe()
        .withHost()
        .getSelectedModels()
        .with({
          onCopy: () => {
            toast(host, 'Copied to clipboard');
          },
        })
        .copySelectedModels()
        .run();
    },
  },
  {
    id: 'convert-to-database',
    name: 'Group as Database',
    disabledToolTip:
      'Contains Block types that cannot be converted to Database',
    icon: DatabaseTableViewIcon20,
    showWhen: host => {
      const selectedModels = host.command.getChainCtx(
        getChainWithHost(host.std).getSelectedModels({
          types: ['block', 'text'],
        })
      ).selectedModels;
      if (!selectedModels || selectedModels.length === 0) return false;

      const firstBlock = selectedModels[0];
      assertExists(firstBlock);
      if (matchFlavours(firstBlock, ['affine:database'])) {
        return false;
      }

      return true;
    },
    enabledWhen: host => {
      const selectedModels = host.command.getChainCtx(
        getChainWithHost(host.std).getSelectedModels({
          types: ['block', 'text'],
        })
      ).selectedModels;
      if (!selectedModels || selectedModels.length === 0) return false;

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
  {
    id: 'convert-to-linked-doc',
    name: 'Create Linked Doc',
    icon: FontLinkedPageIcon,
    hotkey: `Mod-Shift-l`,
    showWhen: host => {
      const selectedModels = host.command.getChainCtx(
        getChainWithHost(host.std).getSelectedModels({
          types: ['block'],
        })
      ).selectedModels;
      return !!selectedModels && selectedModels.length > 0;
    },
    enabledWhen: host => {
      const selectedModels = host.command.getChainCtx(
        getChainWithHost(host.std).getSelectedModels({
          types: ['block'],
        })
      ).selectedModels;
      return !!selectedModels && selectedModels.length > 0;
    },
    action: host => {
      const selectedModels = host.command.getChainCtx(
        getChainWithHost(host.std).getSelectedModels({
          types: ['block'],
        })
      ).selectedModels;
      assertExists(selectedModels);

      host.selection.clear();

      const page = host.page;
      const linkedPage = page.workspace.createPage({});
      linkedPage
        .load(() => {
          const pageBlockId = linkedPage.addBlock('affine:page', {
            title: new page.Text(''),
          });
          linkedPage.addBlock('affine:surface', {}, pageBlockId);
          const noteId = linkedPage.addBlock('affine:note', {}, pageBlockId);

          const firstBlock = selectedModels[0];
          assertExists(firstBlock);

          page.addSiblingBlocks(
            firstBlock,
            [
              {
                flavour: 'affine:embed-linked-doc',
                pageId: linkedPage.id,
              },
            ],
            'before'
          );

          if (
            matchFlavours(firstBlock, ['affine:paragraph']) &&
            firstBlock.type.match(/^h[1-6]$/)
          ) {
            const title = firstBlock.text.toString();
            linkedPage.workspace.setPageMeta(linkedPage.id, {
              title,
            });

            const pageBlock = linkedPage.getBlockById(pageBlockId);
            assertExists(pageBlock);
            linkedPage.updateBlock(pageBlock, {
              title: new page.Text(title),
            });

            page.deleteBlock(firstBlock);
            selectedModels.shift();
          }

          selectedModels.forEach(model => {
            const keys = model.keys as (keyof typeof model)[];
            const values = keys.map(key => model[key]);
            const blockProps = Object.fromEntries(
              keys.map((key, i) => [key, values[i]])
            );
            linkedPage.addBlock(model.flavour, blockProps, noteId);
            page.deleteBlock(model);
          });
        })
        .catch(console.error);

      const linkedDocService = host.spec.getService(
        'affine:embed-linked-doc'
      ) as EmbedLinkedDocService | null;
      assertExists(linkedDocService);
      linkedDocService.slots.linkedDocCreated.emit({ pageId: linkedPage.id });
    },
  },
];
