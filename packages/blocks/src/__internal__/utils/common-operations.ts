import { assertExists } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';
import type { BaseBlockModel } from '@blocksuite/store';
import type { Workspace } from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';

import type { ListType } from '../../list-block/index.js';
import { matchFlavours } from './model.js';
import { asyncGetRichTextByModel, getVirgoByModel } from './query.js';
import type { ExtendedModel } from './types.js';

export async function asyncSetVRange(model: BaseBlockModel, vRange: VRange) {
  const richText = await asyncGetRichTextByModel(model);
  if (!richText) {
    return;
  }

  await richText.updateComplete;
  const vEditor = richText.vEditor;
  assertExists(vEditor);
  vEditor.setVRange(vRange);

  return new Promise<void>(resolve => {
    vEditor.slots.rangeUpdated.once(() => {
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
  if (matchFlavours(model, ['affine:list'])) {
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

export async function createPage(
  workspace: Workspace,
  options: { id?: string; title?: string } = {}
) {
  const page = workspace.createPage({ id: options.id });
  await page.waitForLoaded();

  const pageBlockId = page.addBlock('affine:page', {
    title: new page.Text(options.title ?? ''),
  });
  page.addBlock('affine:surface', {}, pageBlockId);
  const noteId = page.addBlock('affine:note', {}, pageBlockId);
  page.addBlock('affine:paragraph', {}, noteId);
  // To make sure the content of new page would not be clear
  // By undo operation for the first time
  page.resetHistory();
  return page;
}
