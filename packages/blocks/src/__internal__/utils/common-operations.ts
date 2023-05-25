import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';
import type { BaseBlockModel } from '@blocksuite/store';
import type { VEditor, VRange } from '@blocksuite/virgo';

import type {
  BookmarkBlockComponent,
  BookmarkBlockModel,
} from '../../bookmark-block/index.js';
import type { ListType } from '../../list-block/index.js';
import {
  asyncGetRichTextByModel,
  getBlockElementByModel,
  getVirgoByModel,
} from './query.js';
import type { ExtendedModel } from './types.js';

export async function asyncSetVRange(model: BaseBlockModel, vRange: VRange) {
  const richText = await asyncGetRichTextByModel(model);
  richText?.vEditor?.setVRange(vRange);

  return new Promise<void>(resolve => {
    richText?.vEditor?.slots.rangeUpdated.once(() => {
      resolve();
    });
  });
}

export function asyncFocusRichText(
  page: Page,
  id: string,
  vRange: VRange = { index: 0, length: 0 }
) {
  const model = page.getBlockById(id);
  assertExists(model);
  if (matchFlavours(model, ['affine:divider'])) return;
  return asyncSetVRange(model, vRange);
}

export function isCollapsedAtBlockStart(vEditor: VEditor) {
  const vRange = vEditor.getVRange();
  return vRange?.index === 0 && vRange?.length === 0;
}

export function isInSamePath(
  page: Page,
  children: BaseBlockModel,
  father: BaseBlockModel
): boolean {
  if (children === father) {
    return true;
  }
  let parent: BaseBlockModel | null;
  for (;;) {
    parent = page.getParent(children);
    if (parent === null) {
      return false;
    } else if (parent.id === father.id) {
      return true;
    }
    children = parent;
  }
}

export function convertToList(
  page: Page,
  model: ExtendedModel,
  listType: ListType,
  prefix: string,
  otherProperties?: Record<string, unknown>
): boolean {
  if (matchFlavours(model, ['affine:list']) && model['type'] === listType) {
    return false;
  }
  if (matchFlavours(model, ['affine:paragraph'])) {
    const parent = page.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    model.text?.insert(' ', prefix.length);
    page.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const blockProps = {
      type: listType,
      text: model.text?.clone(),
      children: model.children,
      ...otherProperties,
    };
    page.deleteBlock(model);

    const id = page.addBlock('affine:list', blockProps, parent, index);
    asyncFocusRichText(page, id);
  } else if (
    matchFlavours(model, ['affine:list']) &&
    model['type'] !== listType
  ) {
    model.text?.insert(' ', prefix.length);
    page.captureSync();

    model.text?.delete(0, prefix.length + 1);
    page.updateBlock(model, { type: listType });
    asyncFocusRichText(page, model.id);
  }
  return true;
}

export function convertToParagraph(
  page: Page,
  model: ExtendedModel,
  type: 'text' | 'quote' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
  prefix: string
): boolean {
  if (matchFlavours(model, ['affine:paragraph']) && model['type'] === type) {
    return false;
  }
  if (!matchFlavours(model, ['affine:paragraph'])) {
    const parent = page.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    model.text?.insert(' ', prefix.length);
    page.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const blockProps = {
      type: type,
      text: model.text?.clone(),
      children: model.children,
    };
    page.deleteBlock(model);

    const id = page.addBlock('affine:paragraph', blockProps, parent, index);
    asyncFocusRichText(page, id);
  } else if (
    matchFlavours(model, ['affine:paragraph']) &&
    model['type'] !== type
  ) {
    model.text?.insert(' ', prefix.length);
    page.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const vEditor = getVirgoByModel(model);
    if (vEditor) {
      vEditor.setVRange({
        index: 0,
        length: 0,
      });
    }
    page.updateBlock(model, { type: type });
  }
  return true;
}

export function convertToDivider(
  page: Page,
  model: ExtendedModel,
  prefix: string
): boolean {
  if (matchFlavours(model, ['affine:divider']) || model.type === 'quote') {
    return false;
  }
  if (!matchFlavours(model, ['affine:divider'])) {
    const parent = page.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    model.text?.insert(' ', prefix.length);
    page.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const blockProps = {
      children: model.children,
    };
    // space.deleteBlock(model);
    page.addBlock('affine:divider', blockProps, parent, index);

    const nextBlock = parent.children[index + 1];
    if (nextBlock) {
      asyncFocusRichText(page, nextBlock.id);
    } else {
      const nextId = page.addBlock('affine:paragraph', {}, parent);
      asyncFocusRichText(page, nextId);
    }
  }
  return true;
}

export function createBookmarkBlock(
  parentModel: BaseBlockModel,
  index?: number
) {
  const { page } = parentModel;
  const id = page.addBlock(
    'affine:bookmark',
    { url: '' },
    parentModel.id,
    index
  );
  requestAnimationFrame(() => {
    const model = page.getBlockById(id);
    const element = getBlockElementByModel(
      model as BookmarkBlockModel
    ) as BookmarkBlockComponent;
    element.slots.openInitialModal.emit();
  });
  return id;
}
