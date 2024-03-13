import type { Chain, InitCommandCtx } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { html, type TemplateResult } from 'lit';

import { toast } from '../../../_common/components/index.js';
import { createSimplePortal } from '../../../_common/components/portal.js';
import { DATABASE_CONVERT_WHITE_LIST } from '../../../_common/configs/quick-action/database-convert-view.js';
import {
  BoldIcon,
  BulletedListIcon,
  CheckBoxIcon,
  CodeIcon,
  CopyIcon,
  DatabaseTableViewIcon20,
  FontLinkedDocIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ItalicIcon,
  LinkIcon,
  NumberedListIcon,
  QuoteIcon,
  StrikethroughIcon,
  TextIcon,
  UnderlineIcon,
} from '../../../_common/icons/index.js';
import { matchFlavours } from '../../../_common/utils/index.js';
import type { AffineFormatBarWidget } from './format-bar.js';

export type DividerConfigItem = {
  type: 'divider';
};
export type HighlighterDropdownConfigItem = {
  type: 'highlighter-dropdown';
};
export type ParagraphDropdownConfigItem = {
  type: 'paragraph-dropdown';
};
export type InlineActionConfigItem = {
  id: string;
  name: string;
  type: 'inline-action';
  action: (
    chain: Chain<InitCommandCtx>,
    formatBar: AffineFormatBarWidget
  ) => void;
  icon: TemplateResult | (() => HTMLElement);
  isActive: (
    chain: Chain<InitCommandCtx>,
    formatBar: AffineFormatBarWidget
  ) => boolean;
  showWhen: (
    chain: Chain<InitCommandCtx>,
    formatBar: AffineFormatBarWidget
  ) => boolean;
};
export type ParagraphActionConfigItem = {
  id: string;
  type: 'paragraph-action';
  name: string;
  action: (
    chain: Chain<InitCommandCtx>,
    formatBar: AffineFormatBarWidget
  ) => void;
  icon: TemplateResult | (() => HTMLElement);
  flavour: string;
};

export type CustomConfigItem = {
  type: 'custom';
  render: (formatBar: AffineFormatBarWidget) => TemplateResult | null;
};

export type FormatBarConfigItem =
  | DividerConfigItem
  | HighlighterDropdownConfigItem
  | ParagraphDropdownConfigItem
  | ParagraphActionConfigItem
  | InlineActionConfigItem
  | CustomConfigItem;

export function toolbarDefaultConfig(toolbar: AffineFormatBarWidget) {
  toolbar
    .clearConfig()
    .addParagraphDropdown()
    .addDivider()
    .addTextStyleToggle({
      key: 'bold',
      action: chain => chain.toggleBold().run(),
      icon: BoldIcon,
    })
    .addTextStyleToggle({
      key: 'italic',
      action: chain => chain.toggleItalic().run(),
      icon: ItalicIcon,
    })
    .addTextStyleToggle({
      key: 'underline',
      action: chain => chain.toggleUnderline().run(),
      icon: UnderlineIcon,
    })
    .addTextStyleToggle({
      key: 'strike',
      action: chain => chain.toggleStrike().run(),
      icon: StrikethroughIcon,
    })
    .addTextStyleToggle({
      key: 'code',
      action: chain => chain.toggleCode().run(),
      icon: CodeIcon,
    })
    .addTextStyleToggle({
      key: 'link',
      action: chain => chain.toggleLink().run(),
      icon: LinkIcon,
    })
    .addDivider()
    .addHighlighterDropdown()
    .addDivider()
    .addInlineAction({
      id: 'copy',
      name: 'Copy',
      icon: CopyIcon,
      isActive: () => false,
      action: chain => {
        chain
          .getSelectedModels()
          .with({
            onCopy: () => {
              toast(toolbar.host, 'Copied to clipboard');
            },
          })
          .copySelectedModels()
          .run();
      },
      showWhen: () => true,
    })
    .addInlineAction({
      id: 'convert-to-database',
      name: 'Group as Database',
      icon: DatabaseTableViewIcon20,
      isActive: () => false,
      action: () => {
        createSimplePortal({
          template: html`<database-convert-view
            .host=${toolbar.host}
          ></database-convert-view>`,
        });
      },
      showWhen: chain => {
        const [_, ctx] = chain
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
    })
    .addInlineAction({
      id: 'convert-to-linked-doc',
      name: 'Create Linked Doc',
      icon: FontLinkedDocIcon,
      isActive: () => false,
      action: (chain, formatBar) => {
        const [_, ctx] = chain
          .getSelectedModels({
            types: ['block'],
          })
          .run();
        const { selectedModels } = ctx;
        assertExists(selectedModels);

        const host = formatBar.host;
        host.selection.clear();

        const doc = host.doc;
        const linkedDoc = doc.collection.createDoc({});
        linkedDoc.load(() => {
          const rootId = linkedDoc.addBlock('affine:page', {
            title: new doc.Text(''),
          });
          linkedDoc.addBlock('affine:surface', {}, rootId);
          const noteId = linkedDoc.addBlock('affine:note', {}, rootId);

          const firstBlock = selectedModels[0];
          assertExists(firstBlock);

          doc.addSiblingBlocks(
            firstBlock,
            [
              {
                flavour: 'affine:embed-linked-doc',
                pageId: linkedDoc.id,
              },
            ],
            'before'
          );

          if (
            matchFlavours(firstBlock, ['affine:paragraph']) &&
            firstBlock.type.match(/^h[1-6]$/)
          ) {
            const title = firstBlock.text.toString();
            linkedDoc.collection.setDocMeta(linkedDoc.id, {
              title,
            });

            const linkedDocRootModel = linkedDoc.getBlockById(rootId);
            assertExists(linkedDocRootModel);
            linkedDoc.updateBlock(linkedDocRootModel, {
              title: new doc.Text(title),
            });

            doc.deleteBlock(firstBlock);
            selectedModels.shift();
          }

          selectedModels.forEach(model => {
            const keys = model.keys as (keyof typeof model)[];
            const values = keys.map(key => model[key]);
            const blockProps = Object.fromEntries(
              keys.map((key, i) => [key, values[i]])
            );
            linkedDoc.addBlock(model.flavour as never, blockProps, noteId);
            doc.deleteBlock(model);
          });
        });

        const linkedDocService = host.spec.getService(
          'affine:embed-linked-doc'
        );
        linkedDocService.slots.linkedDocCreated.emit({ docId: linkedDoc.id });
      },
      showWhen: chain => {
        const [_, ctx] = chain
          .getSelectedModels({
            types: ['block'],
          })
          .run();
        const { selectedModels } = ctx;
        return !!selectedModels && selectedModels.length > 0;
      },
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      type: 'text',
      name: 'Text',
      icon: TextIcon,
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      type: 'h1',
      name: 'Heading 1',
      icon: Heading1Icon,
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      type: 'h2',
      name: 'Heading 2',
      icon: Heading2Icon,
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      type: 'h3',
      name: 'Heading 3',
      icon: Heading3Icon,
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      type: 'h4',
      name: 'Heading 4',
      icon: Heading4Icon,
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      type: 'h5',
      name: 'Heading 5',
      icon: Heading5Icon,
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      type: 'h6',
      name: 'Heading 6',
      icon: Heading6Icon,
    })
    .addBlockTypeSwitch({
      flavour: 'affine:list',
      type: 'bulleted',
      name: 'Bulleted List',
      icon: BulletedListIcon,
    })
    .addBlockTypeSwitch({
      flavour: 'affine:list',
      type: 'numbered',
      name: 'Numbered List',
      icon: NumberedListIcon,
    })
    .addBlockTypeSwitch({
      flavour: 'affine:list',
      type: 'todo',
      name: 'To-do List',
      icon: CheckBoxIcon,
    })
    .addBlockTypeSwitch({
      flavour: 'affine:code',
      name: 'Code Block',
      icon: CodeIcon,
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      type: 'quote',
      name: 'Quote',
      icon: QuoteIcon,
    });
}
