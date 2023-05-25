import {
  BookmarkIcon,
  CopyIcon,
  DatabaseKanbanViewIcon,
  DatabaseTableViewIcon,
  DeleteIcon,
  DualLinkIcon,
  DuplicateIcon,
  ImageIcon20,
  NewPageIcon,
  NowIcon,
  paragraphConfig,
  // PasteIcon,
  TodayIcon,
  TomorrowIcon,
  YesterdayIcon,
} from '@blocksuite/global/config';
import {
  assertExists,
  type BaseBlockModel,
  type Page,
  Text,
  Utils,
} from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { normalizeDelta } from '../../__internal__/clipboard/utils/commons.js';
import { REFERENCE_NODE } from '../../__internal__/rich-text/reference-node.js';
import type { AffineTextAttributes } from '../../__internal__/rich-text/virgo/types.js';
import { getServiceOrRegister } from '../../__internal__/service.js';
import { restoreSelection } from '../../__internal__/utils/block-range.js';
import {
  createBookmarkBlock,
  getCurrentNativeRange,
  getVirgoByModel,
  resetNativeSelection,
  uploadImageFromLocal,
} from '../../__internal__/utils/index.js';
import { clearMarksOnDiscontinuousInput } from '../../__internal__/utils/virgo.js';
import { copyBlock } from '../../page-block/default/utils.js';
import { formatConfig } from '../../page-block/utils/format-config.js';
import {
  onModelTextUpdated,
  updateBlockType,
} from '../../page-block/utils/index.js';
import { showLinkedPagePopover } from '../linked-page/index.js';
import { toast } from '../toast.js';

export type SlashItem = {
  name: string;
  groupName: string;
  alias?: string[];
  icon: TemplateResult<1>;
  showWhen?: (model: BaseBlockModel) => boolean;
  disabled?: boolean;
  action: ({ page, model }: { page: Page; model: BaseBlockModel }) => void;
};

function insertContent(
  model: BaseBlockModel,
  text: string,
  attributes?: AffineTextAttributes
) {
  if (!model.text) {
    throw new Error("Can't insert text! Text not found");
  }
  const vEditor = getVirgoByModel(model);
  if (!vEditor) {
    throw new Error("Can't insert text! vEditor not found");
  }
  const vRange = vEditor.getVRange();
  const index = vRange ? vRange.index : model.text.length;
  model.text.insert(text, index, attributes);
  // Update the caret to the end of the inserted text
  vEditor.setVRange({
    index: index + text.length,
    length: 0,
  });
}

function formatDate(date: Date) {
  // yyyy-mm-dd
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const strTime = `${year}-${month}-${day}`;
  return strTime;
}

function insideDatabase(model: BaseBlockModel) {
  return Utils.isInsideBlockByFlavour(model.page, model, 'affine:database');
}

export const menuGroups: { name: string; items: SlashItem[] }[] = (
  [
    {
      name: 'Text',
      items: [
        ...paragraphConfig
          .filter(i => i.flavour !== 'affine:list')
          .map<Omit<SlashItem, 'groupName'>>(
            ({ name, icon, flavour, type }) => ({
              name,
              icon,
              showWhen: model => {
                if (!model.page.schema.flavourSchemaMap.has(flavour)) {
                  return false;
                }

                if (['Quote', 'Code Block', 'Divider'].includes(name)) {
                  return !insideDatabase(model);
                }
                return true;
              },
              action: ({ model }) => {
                const newModels = updateBlockType([model], flavour, type);
                // Reset selection if the target is code block
                if (flavour === 'affine:code') {
                  if (newModels.length !== 1) {
                    throw new Error(
                      "Failed to reset selection! New model length isn't 1"
                    );
                  }
                  const codeModel = newModels[0];
                  onModelTextUpdated(codeModel, () => {
                    restoreSelection({
                      type: 'Native',
                      startOffset: 0,
                      endOffset: 0,
                      models: [codeModel],
                    });
                  });
                }
              },
            })
          ),
      ],
    },
    {
      name: 'Style',
      items: formatConfig
        .filter(i => !['Link', 'Code'].includes(i.name))
        .map(({ name, icon, id }) => ({
          name,
          icon,
          action: ({ model }) => {
            if (!model.text) {
              return;
            }
            const len = model.text.length;
            if (!len) {
              const vEditor = getVirgoByModel(model);
              assertExists(vEditor, "Can't set style mark! vEditor not found");
              vEditor.setMarks({
                [id]: true,
              });
              clearMarksOnDiscontinuousInput(vEditor);
              return;
            }
            model.text.format(0, len, {
              [id]: true,
            });
          },
        })),
    },
    {
      name: 'List',
      items: paragraphConfig
        .filter(i => i.flavour === 'affine:list')
        .map(({ name, icon, flavour, type }) => ({
          name,
          icon,
          showWhen: model => {
            if (!model.page.schema.flavourSchemaMap.has(flavour)) {
              return false;
            }
            return true;
          },
          action: ({ model }) => updateBlockType([model], flavour, type),
        })),
    },

    {
      name: 'Pages',
      items: [
        {
          name: 'New Page',
          icon: NewPageIcon,
          showWhen: model =>
            !!model.page.awarenessStore.getFlag('enable_linked_page'),
          action: ({ page, model }) => {
            const newPage = page.workspace.createPage({
              init: true,
            });
            insertContent(model, REFERENCE_NODE, {
              reference: { type: 'LinkedPage', pageId: newPage.id },
            });
          },
        },
        {
          name: 'Link Page',
          alias: ['dual link'],
          icon: DualLinkIcon,
          showWhen: model =>
            !!model.page.awarenessStore.getFlag('enable_linked_page'),
          action: ({ model }) => {
            insertContent(model, '@');
            showLinkedPagePopover({ model, range: getCurrentNativeRange() });
          },
        },
      ],
    },
    {
      name: 'Content & Media',
      items: [
        {
          name: 'Image',
          icon: ImageIcon20,
          showWhen: model => {
            if (!model.page.schema.flavourSchemaMap.has('affine:embed')) {
              return false;
            }
            if (insideDatabase(model)) {
              return false;
            }
            return true;
          },
          async action({ page, model }) {
            const parent = page.getParent(model);
            if (!parent) {
              return;
            }
            parent.children.indexOf(model);
            const props = await uploadImageFromLocal(page);
            page.addSiblingBlocks(model, props);
          },
        },
        {
          name: 'Bookmark',
          icon: BookmarkIcon,
          showWhen: model => {
            if (
              !model.page.awarenessStore.getFlag('enable_bookmark_operation')
            ) {
              return false;
            }
            if (!model.page.schema.flavourSchemaMap.has('affine:embed')) {
              return false;
            }
            return !insideDatabase(model);
          },
          async action({ page, model }) {
            const parent = page.getParent(model);
            if (!parent) {
              return;
            }
            const index = parent.children.indexOf(model);
            createBookmarkBlock(parent, index + 1);
          },
        },
      ],
    },
    {
      name: 'Date & Time',
      items: [
        {
          name: 'Today',
          icon: TodayIcon,
          action: ({ model }) => {
            const date = new Date();
            insertContent(model, formatDate(date));
          },
        },
        {
          name: 'Tomorrow',
          icon: TomorrowIcon,
          action: ({ model }) => {
            // yyyy-mm-dd
            const date = new Date();
            date.setDate(date.getDate() + 1);
            insertContent(model, formatDate(date));
          },
        },
        {
          name: 'Yesterday',
          icon: YesterdayIcon,
          action: ({ model }) => {
            const date = new Date();
            date.setDate(date.getDate() - 1);
            insertContent(model, formatDate(date));
          },
        },
        {
          name: 'Now',
          icon: NowIcon,
          action: ({ model }) => {
            // For example 7:13 pm
            // https://stackoverflow.com/questions/8888491/how-do-you-display-javascript-datetime-in-12-hour-am-pm-format
            const date = new Date();
            let hours = date.getHours();
            const minutes = date.getMinutes();
            const amOrPm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            const min = minutes < 10 ? '0' + minutes : minutes;
            const strTime = hours + ':' + min + ' ' + amOrPm;
            insertContent(model, strTime);
          },
        },
      ],
    },
    {
      name: 'Database',
      items: [
        {
          name: 'Table View',
          alias: ['database'],
          icon: DatabaseTableViewIcon,
          showWhen: model => {
            if (!model.page.awarenessStore.getFlag('enable_database')) {
              return false;
            }
            if (!model.page.schema.flavourSchemaMap.has('affine:database')) {
              return false;
            }
            if (insideDatabase(model)) {
              // You can't add a database block inside another database block
              return false;
            }
            return true;
          },
          action: async ({ page, model }) => {
            const parent = page.getParent(model);
            assertExists(parent);
            const index = parent.children.indexOf(model);

            const id = page.addBlock(
              'affine:database',
              {},
              page.getParent(model),
              index
            );
            const service = await getServiceOrRegister('affine:database');
            service.initDatabaseBlock(page, model, id, false);
          },
        },
        {
          name: 'Kanban View',
          alias: ['database'],
          disabled: true,
          icon: DatabaseKanbanViewIcon,
          showWhen: model => {
            if (!model.page.awarenessStore.getFlag('enable_database')) {
              return false;
            }
            if (!model.page.schema.flavourSchemaMap.has('affine:database')) {
              return false;
            }
            if (insideDatabase(model)) {
              // You can't add a database block inside another database block
              return false;
            }
            return true;
          },
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          action: ({ model }) => {},
        },
      ],
    },
    {
      name: 'Actions',
      items: [
        {
          name: 'Copy',
          icon: CopyIcon,
          action: async ({ model }) => {
            const curRange = getCurrentNativeRange();
            await copyBlock(model);
            resetNativeSelection(curRange);
            toast('Copied to clipboard');
          },
        },
        // {
        //   name: 'Paste',
        //   icon: PasteIcon,
        //   action: async ({ model }) => {
        //     const copiedText = await navigator.clipboard.readText();
        //     console.log('copiedText', copiedText);
        //     insertContent(model, copiedText);
        //   },
        // },
        {
          name: 'Duplicate',
          icon: DuplicateIcon,
          action: ({ page, model }) => {
            if (!model.text || !(model.text instanceof Text)) {
              throw new Error("Can't duplicate a block without text");
            }
            const parent = page.getParent(model);
            if (!parent) {
              throw new Error('Failed to duplicate block! Parent not found');
            }
            const index = parent.children.indexOf(model);

            // TODO add clone model util
            page.addBlock(
              model.flavour,
              {
                type: model.type,
                text: page.Text.fromDelta(
                  normalizeDelta(page, model.text.toDelta())
                ),
                // @ts-expect-error
                checked: model.checked,
              },
              page.getParent(model),
              index
            );
          },
        },
        {
          name: 'Delete',
          icon: DeleteIcon,
          action: ({ page, model }) => {
            page.deleteBlock(model);
          },
        },
      ],
    },
  ] satisfies { name: string; items: Omit<SlashItem, 'groupName'>[] }[]
).map(group => ({
  name: group.name,
  items: group.items.map(item => ({ ...item, groupName: group.name })),
}));
