import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import type { BaseBlockModel } from '@blocksuite/store';
import type { Workspace } from '@blocksuite/store';
import type { VRange } from '@blocksuite/virgo';

import type { ListType } from '../../list-block/index.js';
import { matchFlavours } from './model.js';
import { asyncGetRichTextByModel, getVirgoByModel } from './query.js';

export async function asyncSetVRange(model: BaseBlockModel, vRange: VRange) {
  const richText = await asyncGetRichTextByModel(model);
  if (!richText) {
    return;
  }

  await richText.updateComplete;
  const vEditor = richText.vEditor;
  assertExists(vEditor);
  vEditor.setVRange(vRange);
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

function addSpace(element: BlockElement, index: number) {
  element.model.text?.insert(' ', index);
  const currentText = element.selection.find('text');
  element.selection.setGroup('note', [
    element.selection.getInstance('text', {
      from: {
        path: element.path,
        index: (currentText?.from.index ?? 0) + 1,
        length: 0,
      },
      to: null,
    }),
  ]);
}

export function convertToList(
  element: BlockElement,
  listType: ListType,
  prefix: string,
  otherProperties?: Record<string, unknown>
): boolean {
  const { page, model } = element;
  if (matchFlavours(model, ['affine:list'])) {
    return false;
  }
  if (matchFlavours(model, ['affine:paragraph'])) {
    const parent = page.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    addSpace(element, prefix.length);
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
  element: BlockElement,
  type: 'text' | 'quote' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
  prefix: string
): boolean {
  const { page, model } = element;
  if (matchFlavours(model, ['affine:paragraph']) && model['type'] === type) {
    return false;
  }
  if (!matchFlavours(model, ['affine:paragraph'])) {
    const parent = page.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    addSpace(element, prefix.length);
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
    addSpace(element, prefix.length);
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
  element: BlockElement,
  prefix: string
): boolean {
  const { page, model } = element;
  if (
    matchFlavours(model, ['affine:divider']) ||
    (matchFlavours(model, ['affine:paragraph']) && model.type === 'quote')
  ) {
    return false;
  }
  if (!matchFlavours(model, ['affine:divider'])) {
    const parent = page.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    addSpace(element, prefix.length);
    page.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const blockProps = {
      children: model.children,
    };
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
