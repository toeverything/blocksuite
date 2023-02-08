import { paragraphConfig } from '@blocksuite/global/config';
import type { BaseBlockModel } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import { formatConfig } from '../../page-block/utils/const.js';
import { updateBlockType } from '../../page-block/utils/index.js';
import { toast } from '../toast.js';

export type SlashItem = {
  name: string;
  icon?: TemplateResult<2>;
  action: ({ model }: { model: BaseBlockModel }) => void;
};

export const menuGroups: { name: string; items: SlashItem[] }[] = [
  {
    name: 'Text',
    // TODO append divider
    // TODO filter list
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
        action: ({ model }) => {
          if (!model.text) {
            return;
          }
          const date = new Date();
          const strTime = date.toISOString().split('T')[0];
          // Fix the cursor position
          model.text.insert(strTime, model.text.length);
        },
      },
      {
        name: 'Tomorrow',
        action: ({ model }) => {
          if (!model.text) {
            return;
          }
          const date = new Date();
          date.setDate(date.getDate() + 1);
          const strTime = date.toISOString().split('T')[0];
          // Fix the cursor position
          model.text.insert(strTime, model.text.length);
        },
      },
      {
        name: 'Yesterday',
        action: ({ model }) => {
          if (!model.text) {
            return;
          }
          const date = new Date();
          date.setDate(date.getDate() - 1);
          const strTime = date.toISOString().split('T')[0];
          // Fix the cursor position
          model.text.insert(strTime, model.text.length);
        },
      },
      {
        name: 'Now',
        action: ({ model }) => {
          if (!model.text) {
            return;
          }
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
          // Fix the cursor position
          model.text.insert(strTime, model.text.length);
        },
      },
    ],
  },
  {
    name: 'Actions',
    items: [
      {
        name: 'Copy',
        action: () => {
          // TODO Copy
          toast('Copied to clipboard');
        },
      },
      {
        name: 'Paste',
        action: () => {
          // TODO Paste
        },
      },
      {
        name: 'Duplicate',
        action: () => {
          // TODO Duplicate
        },
      },
      {
        name: 'Delete',
        action: () => {
          // TODO Delete
        },
      },
    ],
  },
];
