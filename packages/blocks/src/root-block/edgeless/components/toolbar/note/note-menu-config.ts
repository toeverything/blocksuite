import type { TemplateResult } from 'lit';

import type { NoteChildrenFlavour } from '../../../../../_common/utils/index.js';
import {
  BLOCKHUB_LIST_ITEMS,
  BLOCKHUB_TEXT_ITEMS,
} from '../../../../widgets/block-hub/config.js';

export const BUTTON_GROUP_LENGTH = 10;

export type NoteMenuItem = {
  icon: TemplateResult<1>;
  tooltip: string;
  childFlavour: NoteChildrenFlavour;
  childType: string | null;
};

// TODO: add image, bookmark, database blocks
export const NOTE_MENU_ITEMS = BLOCKHUB_TEXT_ITEMS.concat(BLOCKHUB_LIST_ITEMS)
  .filter(item => item.name !== 'Divider')
  .map(item => {
    return {
      icon: item.icon,
      tooltip:
        item.type !== 'text'
          ? item.tooltip.replace('Drag/Click to insert ', '')
          : 'Text',
      childFlavour: item.flavour as NoteChildrenFlavour,
      childType: item.type,
    } as NoteMenuItem;
  });
