import {
  CopyIcon,
  DeleteIcon,
  DuplicateIcon,
  NowIcon,
  paragraphConfig,
  PasteIcon,
  TodayIcon,
  TomorrowIcon,
  YesterdayIcon,
} from '@blocksuite/global/config';
import type { BaseBlockModel } from '@blocksuite/store';
import { Page, Text } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { getRichTextByModel } from '../../__internal__/utils/index.js';
import { formatConfig } from '../../page-block/utils/const.js';
import { updateBlockType } from '../../page-block/utils/index.js';
import { toast } from '../toast.js';

export type SlashItem = {
  name: string;
  icon: TemplateResult<1>;
  action: ({ page, model }: { page: Page; model: BaseBlockModel }) => void;
};

function insertContent(model: BaseBlockModel, text: string) {
  if (!model.text) {
    throw new Error("Can't insert text! Text not found");
  }
  const richText = getRichTextByModel(model);
  const quill = richText?.quill;
  if (!quill) {
    throw new Error("Can't insert text! Quill not found");
  }
  const index = quill.getSelection()?.index || model.text.length;
  model.text.insert(text, index);
  // Update the caret to the end of the inserted text
  quill.setSelection(index + text.length, 0);
}

export const menuGroups: { name: string; items: SlashItem[] }[] = [
  {
    name: 'Text',
    // TODO append divider convertToDivider
    items: paragraphConfig
      .filter(i => i.flavour !== 'affine:list')
      .map(({ name, icon, flavour, type }) => ({
        name,
        icon,
        action: ({ model }) => updateBlockType([model], flavour, type),
      })),
  },
  {
    name: 'Style',
    items: formatConfig.map(({ name, icon, id, action }) => ({
      name,
      icon,
      action: ({ model }) => {
        if (!model.text) {
          return;
        }
        const len = model.text.length;
        // TODO check if the format is already applied and remove it
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
        action: ({ model }) => updateBlockType([model], flavour, type),
      })),
  },
  {
    name: 'Date & Time',
    items: [
      {
        name: 'Today',
        icon: TodayIcon,
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
    name: 'Actions',
    items: [
      {
        name: 'Copy',
        icon: CopyIcon,
        action: () => {
          // TODO Copy
          toast('Copied to clipboard');
        },
      },
      {
        name: 'Paste',
        icon: PasteIcon,
        action: () => {
          // TODO Paste
        },
      },
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
          page.addBlockByFlavour(
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
