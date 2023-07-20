import {
  BookmarkIcon,
  CopyIcon,
  DatabaseKanbanViewIcon20,
  DatabaseTableViewIcon20,
  DeleteIcon,
  DualLinkIcon,
  DuplicateIcon,
  ImageIcon20,
  NewPageIcon,
  NowIcon,
  paragraphConfig,
  TodayIcon,
  TomorrowIcon,
  YesterdayIcon,
} from '@blocksuite/global/config';
import { assertExists, Text } from '@blocksuite/store';

import { REFERENCE_NODE } from '../../__internal__/rich-text/reference-node.js';
import { getServiceOrRegister } from '../../__internal__/service.js';
import {
  createPage,
  getCurrentNativeRange,
  getPageBlock,
  getVirgoByModel,
  resetNativeSelection,
  uploadImageFromLocal,
} from '../../__internal__/utils/index.js';
import { clearMarksOnDiscontinuousInput } from '../../__internal__/utils/virgo.js';
import { getBookmarkInitialProps } from '../../bookmark-block/utils.js';
import { copyBlock } from '../../page-block/default/utils.js';
import { formatConfig } from '../../page-block/utils/format-config.js';
import {
  onModelTextUpdated,
  updateBlockType,
} from '../../page-block/utils/index.js';
import type { LinkedPageWidget } from '../linked-page/index.js';
import { toast } from '../toast.js';
import {
  formatDate,
  insertContent,
  insideDatabase,
  insideDataView,
  type SlashItem,
} from './utils.js';

export const menuGroups: { name: string; items: SlashItem[] }[] = [
  {
    name: 'Text',
    items: [
      ...paragraphConfig
        .filter(i => i.flavour !== 'affine:list')
        .map<Omit<SlashItem, 'groupName'>>(({ name, icon, flavour, type }) => ({
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
              onModelTextUpdated(codeModel, richText => {
                const vEditor = richText.vEditor;
                assertExists(vEditor);
                vEditor.focusEnd();
              });
            }
          },
        })),
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
        action: async ({ page, model }) => {
          const newPage = await createPage(page.workspace);
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
          const pageBlock = getPageBlock(model);
          // FIXME not work when customize element
          const linkedPageWidget = pageBlock?.querySelector<LinkedPageWidget>(
            'affine-linked-page-widget'
          );
          assertExists(linkedPageWidget);
          // Wait for range to be updated
          setTimeout(() => {
            linkedPageWidget.showLinkedPage(model);
          });
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
          if (!model.page.schema.flavourSchemaMap.has('affine:image')) {
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
          const props = (await uploadImageFromLocal(page.blobs)).map(
            ({ sourceId }) => ({ flavour: 'affine:image', sourceId })
          );
          page.addSiblingBlocks(model, props);
        },
      },
      {
        name: 'Bookmark',
        icon: BookmarkIcon,
        showWhen: model => {
          if (!model.page.awarenessStore.getFlag('enable_bookmark_operation')) {
            return false;
          }
          return !insideDatabase(model);
        },
        async action({ page, model }) {
          const parent = page.getParent(model);
          if (!parent) {
            return;
          }
          const url = await getBookmarkInitialProps();
          if (!url) return;
          const props = {
            flavour: 'affine:bookmark',
            url,
          } as const;
          page.addSiblingBlocks(model, [props]);
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
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const amOrPm = hours >= 12 ? 'pm' : 'am';
          hours = hours % 12;
          hours = hours ? hours : 12; // the hour '0' should be '12'
          const strTime = hours + ':' + minutes + ' ' + amOrPm;
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
        icon: DatabaseTableViewIcon20,
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
            index + 1
          );
          const service = await getServiceOrRegister('affine:database');
          service.initDatabaseBlock(page, model, id, false);
        },
      },
      {
        name: 'Kanban View',
        alias: ['database'],
        disabled: true,
        icon: DatabaseKanbanViewIcon20,
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
    name: 'Data View',
    items: [
      {
        name: 'Data View Table',
        alias: ['table'],
        icon: DatabaseKanbanViewIcon20,
        showWhen: model => {
          if (!model.page.awarenessStore.getFlag('enable_data_view')) {
            return false;
          }
          if (!model.page.schema.flavourSchemaMap.has('affine:data-view')) {
            return false;
          }
          if (insideDataView(model)) {
            return false;
          }
          return true;
        },
        action: async ({ page, model }) => {
          const parent = page.getParent(model);
          assertExists(parent);
          const index = parent.children.indexOf(model);

          page.addBlock(
            'affine:data-view',
            {},
            page.getParent(model),
            index + 1
          );
        },
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
              text: page.Text.fromDelta(model.text.toDelta()),
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
] satisfies { name: string; items: SlashItem[] }[];
