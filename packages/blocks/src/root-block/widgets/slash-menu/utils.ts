import type { EditorHost } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';
import type { TemplateResult } from 'lit';

import type { AffineTextAttributes } from '../../../_common/inline/presets/affine-inline-specs.js';
import { isInsideBlockByFlavour } from '../../../_common/utils/index.js';
import { getInlineEditorByModel } from '../../../_common/utils/query.js';
import type { RootBlockComponent } from '../../../root-block/types.js';

export type SlashMenuOptions = {
  /**
   * If return false, the slash menu will not show
   *
   * If return string, the slash menu will show and the string will be clear after the slash menu is activated
   */
  isTriggerKey: (e: KeyboardEvent) => false | string;
  menus: {
    name: string;
    items:
      | ((options: {
          rootElement: RootBlockComponent;
          model: BlockModel;
        }) => SlashItem[])
      | SlashItem[];
  }[];
};

export type SlashItem = {
  name: string;
  /**
   * search alias
   */
  alias?: string[];
  /**
   * size 20x20
   */
  icon: TemplateResult<1>;
  suffix?: TemplateResult<1>;
  showWhen?: (model: BlockModel, rootElement: RootBlockComponent) => boolean;
  disabled?: boolean;
  action: ({
    rootElement,
    model,
  }: {
    rootElement: RootBlockComponent;
    model: BlockModel;
  }) => void | Promise<void>;
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
  editorHost: EditorHost,
  model: BlockModel,
  text: string,
  attributes?: AffineTextAttributes
) {
  if (!model.text) {
    throw new Error("Can't insert text! Text not found");
  }
  const inlineEditor = getInlineEditorByModel(editorHost, model);
  if (!inlineEditor) {
    throw new Error("Can't insert text! Inline editor not found");
  }
  const inlineRange = inlineEditor.getInlineRange();
  const index = inlineRange ? inlineRange.index : model.text.length;
  model.text.insert(text, index, attributes as Record<string, unknown>);
  // Update the caret to the end of the inserted text
  inlineEditor.setInlineRange({
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

export function insideDatabase(model: BlockModel) {
  return isInsideBlockByFlavour(model.doc, model, 'affine:database');
}

export function insideDataView(model: BlockModel) {
  return isInsideBlockByFlavour(model.doc, model, 'affine:data-view');
}

export function tryRemoveEmptyLine(model: BlockModel) {
  if (!model.text?.length) {
    model.doc.deleteBlock(model);
  }
}
