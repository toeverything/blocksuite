import {
  BLOCKHUB_LIST_ITEMS,
  BLOCKHUB_TEXT_ITEMS,
} from '@blocksuite/global/config';

import type { NoteChildrenFlavour } from '../../../../../__internal__/index.js';

export const BUTTON_GROUP_LENGTH = 10;

// TODO: add image, bookmark, database blocks
export const NOTE_MENU_ITEMS = BLOCKHUB_TEXT_ITEMS.concat(BLOCKHUB_LIST_ITEMS)
  .filter(item => item.name !== 'Divider')
  .map(item => {
    return {
      icon: item.icon,
      tooltip: item.tooltip.replace('Drag/Click to insert ', ''),
      childFlavour: item.flavour as NoteChildrenFlavour,
      childType: item.type,
    };
  });

export const NOTE_MENU_ITEM_LENGTH = NOTE_MENU_ITEMS.length;
