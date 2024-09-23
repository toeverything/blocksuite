import type { MenuItemGroup } from '@blocksuite/affine-components/toolbar';
import type {
  Chain,
  CommandKeyToData,
  InitCommandCtx,
} from '@blocksuite/block-std';

import {
  BoldIcon,
  BulletedListIcon,
  CheckBoxIcon,
  CodeIcon,
  CopyIcon,
  DatabaseTableViewIcon20,
  DeleteIcon,
  DuplicateIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ItalicIcon,
  LinkedDocIcon,
  LinkIcon,
  MoreVerticalIcon,
  NumberedListIcon,
  QuoteIcon,
  StrikethroughIcon,
  TextIcon,
  UnderlineIcon,
} from '@blocksuite/affine-components/icons';
import { toast } from '@blocksuite/affine-components/toast';
import { renderGroups } from '@blocksuite/affine-components/toolbar';
import { TelemetryProvider } from '@blocksuite/affine-shared/services';
import { tableViewMeta } from '@blocksuite/data-view/view-presets';
import { assertExists } from '@blocksuite/global/utils';
import { Slice } from '@blocksuite/store';
import { html, type TemplateResult } from 'lit';

import type { AffineFormatBarWidget } from './format-bar.js';

import {
  convertSelectedBlocksToLinkedDoc,
  getTitleFromSelectedModels,
  notifyDocCreated,
  promptDocTitle,
} from '../../../_common/utils/render-linked-doc.js';
import { convertToDatabase } from '../../../database-block/data-source.js';
import { DATABASE_CONVERT_WHITE_LIST } from '../../../database-block/utils.js';
import { FormatBarContext } from './context.js';

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
      id: 'convert-to-database',
      name: 'Create Table',
      icon: DatabaseTableViewIcon20,
      isActive: () => false,
      action: () => {
        convertToDatabase(toolbar.host, tableViewMeta.type);
      },
      showWhen: chain => {
        const middleware = (count = 0) => {
          return (
            ctx: CommandKeyToData<'selectedBlocks'>,
            next: () => void
          ) => {
            const { selectedBlocks } = ctx;
            if (!selectedBlocks || selectedBlocks.length === count) return;

            const allowed = selectedBlocks.every(block =>
              DATABASE_CONVERT_WHITE_LIST.includes(block.flavour)
            );
            if (!allowed) return;

            next();
          };
        };
        let [result] = chain
          .getTextSelection()
          .getSelectedBlocks({
            types: ['text'],
          })
          .inline(middleware(1))
          .run();

        if (result) return true;

        [result] = chain
          .tryAll(chain => [
            chain.getBlockSelections(),
            chain.getImageSelections(),
          ])
          .getSelectedBlocks({
            types: ['block', 'image'],
          })
          .inline(middleware(0))
          .run();

        return result;
      },
    })
    .addDivider()
    .addInlineAction({
      id: 'convert-to-linked-doc',
      name: 'Create Linked Doc',
      icon: LinkedDocIcon,
      isActive: () => false,
      action: (chain, formatBar) => {
        const [_, ctx] = chain
          .getSelectedModels({
            types: ['block', 'text'],
            mode: 'highest',
          })
          .run();
        const { selectedModels } = ctx;
        assertExists(selectedModels);
        if (!selectedModels.length) return;

        const host = formatBar.host;
        host.selection.clear();

        const doc = host.doc;
        const autofill = getTitleFromSelectedModels(selectedModels);
        void promptDocTitle(host, autofill).then(title => {
          if (title === null) return;
          convertSelectedBlocksToLinkedDoc(doc, selectedModels, title);
          notifyDocCreated(host, doc);
          host.std.getOptional(TelemetryProvider)?.track('DocCreated', {
            control: 'create linked doc',
            page: 'doc editor',
            module: 'format toolbar',
            type: 'embed-linked-doc',
          });
          host.std.getOptional(TelemetryProvider)?.track('LinkedDocCreated', {
            control: 'create linked doc',
            page: 'doc editor',
            module: 'format toolbar',
            type: 'embed-linked-doc',
          });
        });
      },
      showWhen: chain => {
        const [_, ctx] = chain
          .getSelectedModels({
            types: ['block', 'text'],
            mode: 'highest',
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

export const BUILT_IN_GROUPS: MenuItemGroup<FormatBarContext>[] = [
  {
    type: 'clipboard',
    items: [
      {
        type: 'copy',
        label: 'Copy',
        icon: CopyIcon,
        disabled: c => c.doc.readonly,
        action: c => {
          c.std.command
            .chain()
            .getSelectedModels()
            .with({
              onCopy: () => {
                toast(c.host, 'Copied to clipboard');
              },
            })
            .draftSelectedModels()
            .copySelectedModels()
            .run();
        },
      },
      {
        type: 'duplicate',
        label: 'Duplicate',
        icon: DuplicateIcon,
        disabled: c => c.doc.readonly,
        action: c => {
          c.doc.captureSync();
          c.std.command
            .chain()
            .try(cmd => [
              cmd
                .getTextSelection()
                .inline<'currentSelectionPath'>((ctx, next) => {
                  const textSelection = ctx.currentTextSelection;
                  assertExists(textSelection);
                  const end = textSelection.to ?? textSelection.from;
                  next({ currentSelectionPath: end.blockId });
                }),
              cmd
                .getBlockSelections()
                .inline<'currentSelectionPath'>((ctx, next) => {
                  const currentBlockSelections = ctx.currentBlockSelections;
                  assertExists(currentBlockSelections);
                  const blockSelection = currentBlockSelections.at(-1);
                  if (!blockSelection) {
                    return;
                  }
                  next({ currentSelectionPath: blockSelection.blockId });
                }),
            ])
            .getBlockIndex()
            .getSelectedModels()
            .draftSelectedModels()
            .inline((ctx, next) => {
              if (!ctx.draftedModels) {
                return next();
              }

              ctx.draftedModels
                .then(models => {
                  const slice = Slice.fromModels(ctx.std.doc, models);
                  return ctx.std.clipboard.duplicateSlice(
                    slice,
                    ctx.std.doc,
                    ctx.parentBlock?.model.id,
                    ctx.blockIndex ? ctx.blockIndex + 1 : undefined
                  );
                })
                .catch(console.error);

              return next();
            })
            .run();
        },
      },
    ],
  },
  {
    type: 'delete',
    items: [
      {
        type: 'delete',
        label: 'Delete',
        icon: DeleteIcon,
        disabled: c => c.doc.readonly,
        action: c => {
          // remove text
          const [result] = c.std.command
            .chain()
            .getTextSelection()
            .deleteText()
            .run();

          if (result) {
            return;
          }

          // remove blocks
          c.std.command
            .chain()
            .tryAll(chain => [
              chain.getBlockSelections(),
              chain.getImageSelections(),
            ])
            .getSelectedModels()
            .deleteSelectedModels()
            .run();

          c.toolbar.reset();
        },
      },
    ],
  },
];

export function toolbarMoreButton(toolbar: AffineFormatBarWidget) {
  const context = new FormatBarContext(toolbar);
  const actions = renderGroups(toolbar.moreGroups, context);

  return html`
    <editor-menu-button
      .contentPadding=${'8px'}
      .button=${html`
        <editor-icon-button aria-label="More" .tooltip=${'More'}>
          ${MoreVerticalIcon}
        </editor-icon-button>
      `}
    >
      <div data-size="large" data-orientation="vertical">${actions}</div>
    </editor-menu-button>
  `;
}
