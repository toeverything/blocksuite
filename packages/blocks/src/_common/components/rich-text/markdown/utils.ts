import type { BlockElement } from '@blocksuite/lit';

import {
  asyncFocusRichText,
  getInlineEditorByModel,
  matchFlavours,
} from '../../../../_common/utils/index.js';
import type { ListType } from '../../../../list-block/index.js';

function addSpace(element: BlockElement, index: number) {
  element.model.text?.insert(' ', index);
  const currentText = element.selection.find('text');
  element.selection.setGroup('note', [
    element.selection.create('text', {
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
    page.deleteBlock(model, {
      deleteChildren: false,
    });

    const id = page.addBlock('affine:list', blockProps, parent, index);
    asyncFocusRichText(page, id)?.catch(console.error);
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
    page.deleteBlock(model, {
      deleteChildren: false,
    });

    const id = page.addBlock('affine:paragraph', blockProps, parent, index);
    asyncFocusRichText(page, id)?.catch(console.error);
  } else if (
    matchFlavours(model, ['affine:paragraph']) &&
    model['type'] !== type
  ) {
    addSpace(element, prefix.length);
    page.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const inlineEditor = getInlineEditorByModel(model);
    if (inlineEditor) {
      inlineEditor.setInlineRange({
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
      asyncFocusRichText(page, nextBlock.id)?.catch(console.error);
    } else {
      const nextId = page.addBlock('affine:paragraph', {}, parent);
      asyncFocusRichText(page, nextId)?.catch(console.error);
    }
  }
  return true;
}
