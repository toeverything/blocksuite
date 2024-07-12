import type {
  Chain,
  CommandKeyToData,
  InitCommandCtx,
} from '@blocksuite/block-std';

import { assertExists } from '@blocksuite/global/utils';
import { Slice } from '@blocksuite/store';
import { type TemplateResult, html } from 'lit';

import type { AffineFormatBarWidget } from './format-bar.js';

import { toast } from '../../../_common/components/index.js';
import { createSimplePortal } from '../../../_common/components/portal.js';
import { renderActions } from '../../../_common/components/toolbar/utils.js';
import { DATABASE_CONVERT_WHITE_LIST } from '../../../_common/configs/quick-action/database-convert-view.js';
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
  LinkIcon,
  LinkedDocIcon,
  MoreVerticalIcon,
  NumberedListIcon,
  QuoteIcon,
  StrikethroughIcon,
  TextIcon,
  UnderlineIcon,
} from '../../../_common/icons/index.js';
import {
  convertSelectedBlocksToLinkedDoc,
  getTitleFromSelectedModels,
  notifyDocCreated,
  promptDocTitle,
} from '../../../_common/utils/render-linked-doc.js';

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
  action: (
    chain: Chain<InitCommandCtx>,
    formatBar: AffineFormatBarWidget
  ) => void;
  icon: (() => HTMLElement) | TemplateResult;
  id: string;
  isActive: (
    chain: Chain<InitCommandCtx>,
    formatBar: AffineFormatBarWidget
  ) => boolean;
  name: string;
  showWhen: (
    chain: Chain<InitCommandCtx>,
    formatBar: AffineFormatBarWidget
  ) => boolean;
  type: 'inline-action';
};
export type ParagraphActionConfigItem = {
  action: (
    chain: Chain<InitCommandCtx>,
    formatBar: AffineFormatBarWidget
  ) => void;
  flavour: string;
  icon: (() => HTMLElement) | TemplateResult;
  id: string;
  name: string;
  type: 'paragraph-action';
};

export type CustomConfigItem = {
  render: (formatBar: AffineFormatBarWidget) => TemplateResult | null;
  type: 'custom';
};

export type FormatBarConfigItem =
  | CustomConfigItem
  | DividerConfigItem
  | HighlighterDropdownConfigItem
  | InlineActionConfigItem
  | ParagraphActionConfigItem
  | ParagraphDropdownConfigItem;

export function toolbarDefaultConfig(toolbar: AffineFormatBarWidget) {
  toolbar
    .clearConfig()
    .addParagraphDropdown()
    .addDivider()
    .addTextStyleToggle({
      action: chain => chain.toggleBold().run(),
      icon: BoldIcon,
      key: 'bold',
    })
    .addTextStyleToggle({
      action: chain => chain.toggleItalic().run(),
      icon: ItalicIcon,
      key: 'italic',
    })
    .addTextStyleToggle({
      action: chain => chain.toggleUnderline().run(),
      icon: UnderlineIcon,
      key: 'underline',
    })
    .addTextStyleToggle({
      action: chain => chain.toggleStrike().run(),
      icon: StrikethroughIcon,
      key: 'strike',
    })
    .addTextStyleToggle({
      action: chain => chain.toggleCode().run(),
      icon: CodeIcon,
      key: 'code',
    })
    .addTextStyleToggle({
      action: chain => chain.toggleLink().run(),
      icon: LinkIcon,
      key: 'link',
    })
    .addDivider()
    .addHighlighterDropdown()
    .addDivider()
    .addInlineAction({
      action: () => {
        createSimplePortal({
          template: html`<database-convert-view
            .host=${toolbar.host}
          ></database-convert-view>`,
        });
      },
      icon: DatabaseTableViewIcon20,
      id: 'convert-to-database',
      isActive: () => false,
      name: 'Create Database',
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
      action: (chain, formatBar) => {
        const [_, ctx] = chain
          .getSelectedModels({
            mode: 'highest',
            types: ['block', 'text'],
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
          host.spec
            .getService('affine:page')
            .telemetryService?.track('DocCreated', {
              control: 'create linked doc',
              module: 'format toolbar',
              page: 'doc editor',
              type: 'embed-linked-doc',
            });
          host.spec
            .getService('affine:page')
            .telemetryService?.track('LinkedDocCreated', {
              control: 'create linked doc',
              module: 'format toolbar',
              page: 'doc editor',
              type: 'embed-linked-doc',
            });
        });
      },
      icon: LinkedDocIcon,
      id: 'convert-to-linked-doc',
      isActive: () => false,
      name: 'Create Linked Doc',
      showWhen: chain => {
        const [_, ctx] = chain
          .getSelectedModels({
            mode: 'highest',
            types: ['block', 'text'],
          })
          .run();
        const { selectedModels } = ctx;
        return !!selectedModels && selectedModels.length > 0;
      },
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      icon: TextIcon,
      name: 'Text',
      type: 'text',
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      icon: Heading1Icon,
      name: 'Heading 1',
      type: 'h1',
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      icon: Heading2Icon,
      name: 'Heading 2',
      type: 'h2',
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      icon: Heading3Icon,
      name: 'Heading 3',
      type: 'h3',
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      icon: Heading4Icon,
      name: 'Heading 4',
      type: 'h4',
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      icon: Heading5Icon,
      name: 'Heading 5',
      type: 'h5',
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      icon: Heading6Icon,
      name: 'Heading 6',
      type: 'h6',
    })
    .addBlockTypeSwitch({
      flavour: 'affine:list',
      icon: BulletedListIcon,
      name: 'Bulleted List',
      type: 'bulleted',
    })
    .addBlockTypeSwitch({
      flavour: 'affine:list',
      icon: NumberedListIcon,
      name: 'Numbered List',
      type: 'numbered',
    })
    .addBlockTypeSwitch({
      flavour: 'affine:list',
      icon: CheckBoxIcon,
      name: 'To-do List',
      type: 'todo',
    })
    .addBlockTypeSwitch({
      flavour: 'affine:code',
      icon: CodeIcon,
      name: 'Code Block',
    })
    .addBlockTypeSwitch({
      flavour: 'affine:paragraph',
      icon: QuoteIcon,
      name: 'Quote',
      type: 'quote',
    });
}

export function toolbarMoreButton(toolbar: AffineFormatBarWidget) {
  const actions = [
    [
      {
        disabled: toolbar.doc.readonly,
        handler: () => {
          toolbar.std.command
            .chain()
            .getSelectedModels()
            .with({
              onCopy: () => {
                toast(toolbar.host, 'Copied to clipboard');
              },
            })
            .draftSelectedModels()
            .copySelectedModels()
            .run();
        },
        icon: CopyIcon,
        name: 'Copy',
        type: 'copy',
      },
      {
        disabled: toolbar.doc.readonly,
        handler: () => {
          toolbar.std.doc.captureSync();
          toolbar.std.command
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

              assertExists(ctx.parentBlock);

              toolbar.std.clipboard
                .duplicateSlice(
                  Slice.fromModels(ctx.std.doc, ctx.draftedModels),
                  ctx.std.doc,
                  ctx.parentBlock?.model.id,
                  ctx.blockIndex ? ctx.blockIndex + 1 : undefined
                )
                .catch(console.error);

              return next();
            })
            .run();
        },
        icon: DuplicateIcon,
        name: 'Duplicate',
        type: 'duplicate',
      },
    ],
    [
      {
        disabled: toolbar.doc.readonly,
        handler: () => {
          // remove text
          const [result] = toolbar.std.command
            .chain()
            .getTextSelection()
            .deleteText()
            .run();

          if (result) {
            return;
          }

          // remove blocks
          toolbar.std.command
            .chain()
            .tryAll(chain => [
              chain.getBlockSelections(),
              chain.getImageSelections(),
            ])
            .getSelectedModels()
            .deleteSelectedModels()
            .run();

          toolbar.reset();
        },
        icon: DeleteIcon,
        name: 'Delete',
        type: 'delete',
      },
    ],
  ];

  return html`
    <editor-menu-button
      .contentPadding=${'8px'}
      .button=${html`
        <editor-icon-button aria-label="More" .tooltip=${'More'}>
          ${MoreVerticalIcon}
        </editor-icon-button>
      `}
    >
      <div slot data-orientation="vertical">${renderActions(actions)}</div>
    </editor-menu-button>
  `;
}
