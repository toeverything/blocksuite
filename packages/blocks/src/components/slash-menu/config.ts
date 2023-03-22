import {
  CopyIcon,
  DatabaseTableViewIcon,
  DeleteIcon,
  DividerIcon,
  DuplicateIcon,
  ImageIcon20,
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
} from '@blocksuite/store';
import { Text } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { getServiceOrRegister } from '../../__internal__/service.js';
import { restoreSelection } from '../../__internal__/utils/block-range.js';
import {
  getCurrentNativeRange,
  getVirgoByModel,
  resetNativeSelection,
  uploadImageFromLocal,
} from '../../__internal__/utils/index.js';
import { copyBlock } from '../../page-block/default/utils.js';
import { formatConfig } from '../../page-block/utils/const.js';
import {
  onModelTextUpdated,
  updateBlockType,
} from '../../page-block/utils/index.js';
import { toast } from '../toast.js';

export type SlashItem = {
  name: string;
  icon: TemplateResult<1>;
  divider?: boolean;
  disabled?: boolean;
  action: ({ page, model }: { page: Page; model: BaseBlockModel }) => void;
};

function insertContent(model: BaseBlockModel, text: string) {
  if (!model.text) {
    throw new Error("Can't insert text! Text not found");
  }
  const vEditor = getVirgoByModel(model);
  if (!vEditor) {
    throw new Error("Can't insert text! vEditor not found");
  }
  const vRange = vEditor.getVRange();
  const index = vRange ? vRange.index : model.text.length;
  model.text.insert(text, index);
  // Update the caret to the end of the inserted text
  vEditor.setVRange({
    index: index + text.length,
    length: 0,
  });
}

const dividerItem: SlashItem = {
  name: 'Divider',
  icon: DividerIcon,
  action({ page, model }) {
    const parent = page.getParent(model);
    if (!parent) {
      return;
    }
    const index = parent.children.indexOf(model);
    page.addBlock('affine:divider', {}, parent, index + 1);
  },
};

export const menuGroups: { name: string; items: SlashItem[] }[] = [
  {
    name: 'Text',
    items: [
      ...paragraphConfig
        .filter(i => i.flavour !== 'affine:list')
        .map<SlashItem>(({ name, icon, flavour, type }) => ({
          name,
          icon,
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
        })),
      dividerItem,
    ],
  },
  {
    name: 'Style',
    items: formatConfig
      .filter(i => !['Link', 'Code'].includes(i.name))
      .map(({ name, icon, id }, idx) => ({
        name,
        icon,
        divider: idx === 0,
        action: ({ model }) => {
          if (!model.text) {
            return;
          }
          const len = model.text.length;
          const vEditor = getVirgoByModel(model);
          assertExists(vEditor, "Can't set style mark! vEditor not found");
          vEditor.setMarks({
            [id]: true,
          });
          if (!len) {
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
      .map(({ name, icon, flavour, type }, idx) => ({
        name,
        icon,
        divider: idx === 0,
        action: ({ model }) => updateBlockType([model], flavour, type),
      })),
  },
  {
    name: 'Image & File',
    items: [
      {
        name: 'Image',
        icon: ImageIcon20,
        divider: true,
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
    ],
  },
  {
    name: 'Date & Time',
    items: [
      {
        name: 'Today',
        icon: TodayIcon,
        divider: true,
        action: ({ model }) => {
          const date = new Date();
          const strTime = date.toISOString().split('T')[0];
          insertContent(model, strTime);
        },
      },
      {
        name: 'Tomorrow',
        icon: TomorrowIcon,
        action: ({ model }) => {
          const date = new Date();
          date.setDate(date.getDate() + 1);
          const strTime = date.toISOString().split('T')[0];
          insertContent(model, strTime);
        },
      },
      {
        name: 'Yesterday',
        icon: YesterdayIcon,
        action: ({ model }) => {
          const date = new Date();
          date.setDate(date.getDate() - 1);
          const strTime = date.toISOString().split('T')[0];
          insertContent(model, strTime);
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
        icon: DatabaseTableViewIcon,
        divider: true,
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
        // TODO: change icon
        icon: DatabaseTableViewIcon,
        disabled: true,
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
        divider: true,
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
];
