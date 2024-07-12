import type { EditorHost } from '@blocksuite/block-std';

import { assertExists } from '@blocksuite/global/utils';
import { type TemplateResult, html } from 'lit';

import { matchFlavours } from '../../../_common/utils/model.js';
import { createSimplePortal } from '../../components/portal.js';
import { toast } from '../../components/toast.js';
import {
  CopyIcon,
  DatabaseTableViewIcon20,
  LinkedDocIcon,
} from '../../icons/index.js';
import {
  convertSelectedBlocksToLinkedDoc,
  getTitleFromSelectedModels,
  notifyDocCreated,
  promptDocTitle,
} from '../../utils/render-linked-doc.js';
import './database-convert-view.js';
import { DATABASE_CONVERT_WHITE_LIST } from './database-convert-view.js';

export interface QuickActionConfig {
  action: (host: EditorHost) => void;
  disabledToolTip?: string;
  enabledWhen: (host: EditorHost) => boolean;
  hotkey?: string;
  icon: TemplateResult<1>;
  id: string;
  name: string;
  showWhen: (host: EditorHost) => boolean;
}

export const quickActionConfig: QuickActionConfig[] = [
  {
    action: host => {
      host.std.command
        .chain()
        .getSelectedModels()
        .with({
          onCopy: () => {
            toast(host, 'Copied to clipboard');
          },
        })
        .draftSelectedModels()
        .copySelectedModels()
        .run();
    },
    disabledToolTip: undefined,
    enabledWhen: () => true,
    hotkey: undefined,
    icon: CopyIcon,
    id: 'copy',
    name: 'Copy',
    showWhen: () => true,
  },
  {
    action: host => {
      createSimplePortal({
        template: html`<database-convert-view
          .host=${host}
        ></database-convert-view>`,
      });
    },
    disabledToolTip:
      'Contains Block types that cannot be converted to Database',
    enabledWhen: host => {
      const [_, ctx] = host.std.command
        .chain()
        .getSelectedModels({
          types: ['block', 'text'],
        })
        .run();
      const { selectedModels } = ctx;
      if (!selectedModels || selectedModels.length === 0) return false;

      return selectedModels.every(block =>
        DATABASE_CONVERT_WHITE_LIST.includes(block.flavour)
      );
    },
    icon: DatabaseTableViewIcon20,
    id: 'convert-to-database',
    name: 'Group as Database',
    showWhen: host => {
      const [_, ctx] = host.std.command
        .chain()
        .getSelectedModels({
          types: ['block', 'text'],
        })
        .run();
      const { selectedModels } = ctx;
      if (!selectedModels || selectedModels.length === 0) return false;

      const firstBlock = selectedModels[0];
      assertExists(firstBlock);
      if (matchFlavours(firstBlock, ['affine:database'])) {
        return false;
      }

      return true;
    },
  },
  {
    action: host => {
      const [_, ctx] = host.std.command
        .chain()
        .getSelectedModels({
          mode: 'highest',
          types: ['block'],
        })
        .run();
      const { selectedModels } = ctx;
      assertExists(selectedModels);
      if (!selectedModels.length) return;

      host.selection.clear();

      const doc = host.doc;
      const autofill = getTitleFromSelectedModels(selectedModels);
      void promptDocTitle(host, autofill).then(title => {
        if (title === null) return;
        const linkedDoc = convertSelectedBlocksToLinkedDoc(
          doc,
          selectedModels,
          title
        );
        const linkedDocService = host.spec.getService(
          'affine:embed-linked-doc'
        );
        linkedDocService.slots.linkedDocCreated.emit({ docId: linkedDoc.id });
        notifyDocCreated(host, doc);
      });
    },
    enabledWhen: host => {
      const [_, ctx] = host.std.command
        .chain()
        .getSelectedModels({
          types: ['block'],
        })
        .run();
      const { selectedModels } = ctx;
      return !!selectedModels && selectedModels.length > 0;
    },
    hotkey: `Mod-Shift-l`,
    icon: LinkedDocIcon,
    id: 'convert-to-linked-doc',
    name: 'Create Linked Doc',
    showWhen: host => {
      const [_, ctx] = host.std.command
        .chain()
        .getSelectedModels({
          types: ['block'],
        })
        .run();
      const { selectedModels } = ctx;
      return !!selectedModels && selectedModels.length > 0;
    },
  },
];
