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
import { isFormatSupported } from '../../../note-block/commands/utils.js';
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
  action: (formatBar: AffineFormatBarWidget) => void;
  icon: TemplateResult | (() => HTMLElement);
  isActive: (formatBar: AffineFormatBarWidget) => boolean;
  showWhen: (formatBar: AffineFormatBarWidget) => boolean;
};
export type ParagraphActionConfigItem = {
  id: string;
  type: 'paragraph-action';
  name: string;
  action: (formatBar: AffineFormatBarWidget) => void;
  icon: TemplateResult | (() => HTMLElement);
  flavour: string;
};
export type FormatBarConfigItem =
  | DividerConfigItem
  | HighlighterDropdownConfigItem
  | ParagraphDropdownConfigItem
  | ParagraphActionConfigItem
  | InlineActionConfigItem;

export const defaultConfig: FormatBarConfigItem[] = [
  {
    type: 'paragraph-dropdown',
  },
  {
    type: 'divider',
  },
  {
    id: 'bold',
    type: 'inline-action',
    name: 'Bold',
    icon: BoldIcon,
    isActive: formatBar => {
      const [result] = formatBar.std.command
        .chain()
        .isTextStyleActive({ key: 'bold' })
        .run();
      return result;
    },
    action: formatBar => {
      formatBar.std.command.chain().toggleBold().run();
    },
    showWhen: formatBar => {
      const [result] = isFormatSupported(formatBar.std).run();
      return result;
    },
  },
  {
    id: 'italic',
    type: 'inline-action',
    name: 'Italic',
    icon: ItalicIcon,
    isActive: formatBar => {
      const [result] = formatBar.std.command
        .chain()
        .isTextStyleActive({ key: 'italic' })
        .run();
      return result;
    },
    action: formatBar => {
      formatBar.std.command.chain().toggleItalic().run();
    },
    showWhen: formatBar => {
      const [result] = isFormatSupported(formatBar.std).run();
      return result;
    },
  },
  {
    id: 'underline',
    type: 'inline-action',
    name: 'Underline',
    icon: UnderlineIcon,
    isActive: formatBar => {
      const [result] = formatBar.std.command
        .chain()
        .isTextStyleActive({ key: 'underline' })
        .run();
      return result;
    },
    action: formatBar => {
      formatBar.std.command.chain().toggleUnderline().run();
    },
    showWhen: formatBar => {
      const [result] = isFormatSupported(formatBar.std).run();
      return result;
    },
  },
  {
    id: 'strike',
    type: 'inline-action',
    name: 'Strike',
    icon: StrikethroughIcon,
    isActive: formatBar => {
      const [result] = formatBar.std.command
        .chain()
        .isTextStyleActive({ key: 'strike' })
        .run();
      return result;
    },
    action: formatBar => {
      formatBar.std.command.chain().toggleStrike().run();
    },
    showWhen: formatBar => {
      const [result] = isFormatSupported(formatBar.std).run();
      return result;
    },
  },
  {
    id: 'code',
    type: 'inline-action',
    name: 'Code',
    icon: CodeIcon,
    isActive: formatBar => {
      const [result] = formatBar.std.command
        .chain()
        .isTextStyleActive({ key: 'code' })
        .run();
      return result;
    },
    action: formatBar => {
      formatBar.std.command.chain().toggleCode().run();
    },
    showWhen: formatBar => {
      const [result] = isFormatSupported(formatBar.std).run();
      return result;
    },
  },
  {
    id: 'link',
    type: 'inline-action',
    name: 'Link',
    icon: LinkIcon,
    isActive: formatBar => {
      const [result] = formatBar.std.command
        .chain()
        .isTextStyleActive({ key: 'link' })
        .run();
      return result;
    },
    action: formatBar => {
      formatBar.std.command.chain().toggleLink().run();
    },
    showWhen: formatBar => {
      const [result] = isFormatSupported(formatBar.std).run();
      return result;
    },
  },
  {
    type: 'divider',
  },
  {
    type: 'highlighter-dropdown',
  },
  {
    type: 'divider',
  },
  {
    id: 'copy',
    type: 'inline-action',
    name: 'Copy',
    icon: CopyIcon,
    isActive: () => false,
    action: formatBar => {
      formatBar.std.command
        .chain()
        .getSelectedModels()
        .with({
          onCopy: () => {
            toast(formatBar.host, 'Copied to clipboard');
          },
        })
        .copySelectedModels()
        .run();
    },
    showWhen: () => true,
  },
  {
    id: 'convert-to-database',
    type: 'inline-action',
    name: 'Group as Database',
    icon: DatabaseTableViewIcon20,
    isActive: () => false,
    action: formatBar => {
      createSimplePortal({
        template: html`<database-convert-view
          .host=${formatBar.host}
        ></database-convert-view>`,
      });
    },
    showWhen: formatBar => {
      const [_, ctx] = formatBar.std.command
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
  },
  {
    id: 'convert-to-linked-doc',
    type: 'inline-action',
    name: 'Create Linked Doc',
    icon: FontLinkedDocIcon,
    isActive: () => false,
    action: formatBar => {
      const [_, ctx] = formatBar.std.command
        .chain()
        .getSelectedModels({
          types: ['block'],
        })
        .run();
      const { selectedModels } = ctx;
      assertExists(selectedModels);

      const host = formatBar.host;
      host.selection.clear();

      const doc = host.doc;
      const linkedDoc = doc.workspace.createDoc({});
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
          linkedDoc.workspace.setDocMeta(linkedDoc.id, {
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

      const linkedDocService = host.spec.getService('affine:embed-linked-doc');
      linkedDocService.slots.linkedDocCreated.emit({ docId: linkedDoc.id });
    },
    showWhen: formatBar => {
      const [_, ctx] = formatBar.std.command
        .chain()
        .getSelectedModels({
          types: ['block'],
        })
        .run();
      const { selectedModels } = ctx;
      return !!selectedModels && selectedModels.length > 0;
    },
  },
  {
    id: 'affine:paragraph/text',
    type: 'paragraph-action',
    flavour: 'affine:paragraph',
    name: 'Text',
    icon: TextIcon,
    action: formatBar => {
      formatBar.std.command
        .chain()
        .updateBlockType({
          flavour: 'affine:paragraph',
          props: { type: 'text' },
        })
        .run();
    },
  },
  {
    id: 'affine:paragraph/h1',
    type: 'paragraph-action',
    flavour: 'affine:paragraph',
    name: 'Heading 1',
    icon: Heading1Icon,
    action: formatBar => {
      formatBar.std.command
        .chain()
        .updateBlockType({
          flavour: 'affine:paragraph',
          props: { type: 'h1' },
        })
        .run();
    },
  },
  {
    id: 'affine:paragraph/h2',
    type: 'paragraph-action',
    flavour: 'affine:paragraph',
    name: 'Heading 2',
    icon: Heading2Icon,
    action: formatBar => {
      formatBar.std.command
        .chain()
        .updateBlockType({
          flavour: 'affine:paragraph',
          props: { type: 'h2' },
        })
        .run();
    },
  },
  {
    id: 'affine:paragraph/h3',
    type: 'paragraph-action',
    flavour: 'affine:paragraph',
    name: 'Heading 3',
    icon: Heading3Icon,
    action: formatBar => {
      formatBar.std.command
        .chain()
        .updateBlockType({
          flavour: 'affine:paragraph',
          props: { type: 'h3' },
        })
        .run();
    },
  },
  {
    id: 'affine:paragraph/h4',
    type: 'paragraph-action',
    flavour: 'affine:paragraph',
    name: 'Heading 4',
    icon: Heading4Icon,
    action: formatBar => {
      formatBar.std.command
        .chain()
        .updateBlockType({
          flavour: 'affine:paragraph',
          props: { type: 'h4' },
        })
        .run();
    },
  },
  {
    id: 'affine:paragraph/h5',
    type: 'paragraph-action',
    flavour: 'affine:paragraph',
    name: 'Heading 5',
    icon: Heading5Icon,
    action: formatBar => {
      formatBar.std.command
        .chain()
        .updateBlockType({
          flavour: 'affine:paragraph',
          props: { type: 'h5' },
        })
        .run();
    },
  },
  {
    id: 'affine:paragraph/h6',
    type: 'paragraph-action',
    flavour: 'affine:paragraph',
    name: 'Heading 6',
    icon: Heading6Icon,
    action: formatBar => {
      formatBar.std.command
        .chain()
        .updateBlockType({
          flavour: 'affine:paragraph',
          props: { type: 'h6' },
        })
        .run();
    },
  },
  {
    id: 'affine:list/bulleted',
    type: 'paragraph-action',
    flavour: 'affine:list',
    name: 'Bulleted List',
    icon: BulletedListIcon,
    action: formatBar => {
      formatBar.std.command
        .chain()
        .updateBlockType({
          flavour: 'affine:list',
          props: { type: 'bulleted' },
        })
        .run();
    },
  },
  {
    id: 'affine:list/numbered',
    type: 'paragraph-action',
    flavour: 'affine:list',
    name: 'Numbered List',
    icon: NumberedListIcon,
    action: formatBar => {
      formatBar.std.command
        .chain()
        .updateBlockType({
          flavour: 'affine:list',
          props: { type: 'numbered' },
        })
        .run();
    },
  },
  {
    id: 'affine:list/todo',
    type: 'paragraph-action',
    flavour: 'affine:list',
    name: 'To-do List',
    icon: CheckBoxIcon,
    action: formatBar => {
      formatBar.std.command
        .chain()
        .updateBlockType({
          flavour: 'affine:list',
          props: { type: 'todo' },
        })
        .run();
    },
  },
  {
    id: 'affine:code/',
    type: 'paragraph-action',
    flavour: 'affine:code',
    name: 'Code Block',
    icon: CodeIcon,
    action: formatBar => {
      formatBar.std.command
        .chain()
        .updateBlockType({
          flavour: 'affine:code',
        })
        .run();
    },
  },
  {
    id: 'affine:paragraph/quote',
    type: 'paragraph-action',
    flavour: 'affine:paragraph',
    name: 'Quote',
    icon: QuoteIcon,
    action: formatBar => {
      formatBar.std.command
        .chain()
        .updateBlockType({
          flavour: 'affine:paragraph',
          props: { type: 'quote' },
        })
        .run();
    },
  },
];
