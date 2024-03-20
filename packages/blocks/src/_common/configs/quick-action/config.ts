import './database-convert-view.js';

import type { EditorHost } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { html, type TemplateResult } from 'lit';

import { matchFlavours } from '../../../_common/utils/model.js';
import { createSimplePortal } from '../../components/portal.js';
import { toast } from '../../components/toast.js';
import {
  CopyIcon,
  DatabaseTableViewIcon20,
  FontLinkedDocIcon,
} from '../../icons/index.js';
import { createLinkedDocFromSelectedBlocks } from '../../utils/render-linked-doc.js';
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
        .chain()
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
    icon: FontLinkedDocIcon,
    hotkey: `Mod-Shift-l`,
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
    action: host => {
      const [_, ctx] = host.std.command
        .chain()
        .getSelectedModels({
          types: ['block'],
          mode: 'highest',
        })
        .run();
      const { selectedModels } = ctx;
      assertExists(selectedModels);
      if (!selectedModels.length) return;

      host.selection.clear();

      const doc = host.doc;
      const linkedDoc = createLinkedDocFromSelectedBlocks(doc, selectedModels);
      const linkedDocService = host.spec.getService('affine:embed-linked-doc');
      linkedDocService.slots.linkedDocCreated.emit({ docId: linkedDoc.id });
    },
  },
];
