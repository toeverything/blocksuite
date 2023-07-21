import type { BaseBlockModel, Page } from '@blocksuite/store';
import { Utils } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import type { AffineTextAttributes } from '../../__internal__/rich-text/virgo/types.js';
import { getVirgoByModel } from '../../__internal__/utils/query.js';

export type SlashMenuOptions = {
  isTriggerKey: (e: KeyboardEvent) => boolean;
  menus: {
    name: string;
    items: SlashItem[];
  }[];
};

export type SlashItem = {
  name: string;
  /**
   * search alias
   */
  alias?: string[];
  icon: TemplateResult<1>;
  suffix?: TemplateResult<1>;
  showWhen?: (model: BaseBlockModel) => boolean;
  disabled?: boolean;
  action: ({ page, model }: { page: Page; model: BaseBlockModel }) => void;
};

export type InternSlashItem = SlashItem & { groupName: string };

export function collectGroupNames(menuItem: InternSlashItem[]) {
  return menuItem.reduce((acc, item) => {
    if (!acc.length || acc[acc.length - 1] !== item.groupName) {
      acc.push(item.groupName);
    }
    return acc;
  }, [] as string[]);
}

export function insertContent(
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

export function formatDate(date: Date) {
  // yyyy-mm-dd
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const strTime = `${year}-${month}-${day}`;
  return strTime;
}

export function insideDatabase(model: BaseBlockModel) {
  return Utils.isInsideBlockByFlavour(model.page, model, 'affine:database');
}

export function insideDataView(model: BaseBlockModel) {
  return Utils.isInsideBlockByFlavour(model.page, model, 'affine:data-view');
}
