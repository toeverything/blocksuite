import type { ListType } from '@blocksuite/affine-model';
import type { BlockComponent } from '@blocksuite/block-std';

import {
  asyncFocusRichText,
  getInlineEditorByModel,
} from '@blocksuite/affine-components/rich-text';
import { matchFlavours } from '@blocksuite/affine-shared/utils';

function addSpace(element: BlockComponent, index: number) {
  element.model.text?.insert(' ', index);
  const currentText = element.selection.find('text');
  element.selection.setGroup('note', [
    element.selection.create('text', {
      from: {
        blockId: element.blockId,
        index: (currentText?.from.index ?? 0) + 1,
        length: 0,
      },
      to: null,
    }),
  ]);
}

export function convertToList(
  element: BlockComponent,
  listType: ListType,
  prefix: string,
  otherProperties?: Record<string, unknown>
): boolean {
  const { doc, model } = element;
  if (matchFlavours(model, ['affine:list'])) {
    return false;
  }
  if (matchFlavours(model, ['affine:paragraph'])) {
    const parent = doc.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    addSpace(element, prefix.length);
    doc.captureSync();
    model.text?.delete(0, prefix.length + 1);

    if (listType === 'numbered') {
      let order = parseInt(prefix.slice(0, -1));
      if (!Number.isInteger(order)) order = 1;
      const { list } = element.std.command.exec('convertToNumberedList', {
        id: model.id,
        order,
        stopCapturing: false,
      });
      if (!list) return false;
      element.host.updateComplete
        .then(() => {
          const listElement = element.host.view.getBlock(list.id);
          element.std.command.exec('focusBlockStart', {
            focusBlock: listElement,
          });
        })
        .catch(console.error);
    } else {
      const blockProps = {
        type: listType,
        text: model.text?.clone(),
        children: model.children,
        ...otherProperties,
      };
      doc.deleteBlock(model, {
        deleteChildren: false,
      });

      const id = doc.addBlock('affine:list', blockProps, parent, index);
      asyncFocusRichText(element.host, id)?.catch(console.error);
    }
  }
  return true;
}

export function convertToParagraph(
  element: BlockComponent,
  type: 'text' | 'quote' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
  prefix: string
): boolean {
  const { doc, model } = element;
  if (matchFlavours(model, ['affine:paragraph']) && model['type'] === type) {
    return false;
  }
  if (!matchFlavours(model, ['affine:paragraph'])) {
    const parent = doc.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    addSpace(element, prefix.length);
    doc.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const blockProps = {
      type: type,
      text: model.text?.clone(),
      children: model.children,
    };
    doc.deleteBlock(model, {
      deleteChildren: false,
    });

    const id = doc.addBlock('affine:paragraph', blockProps, parent, index);
    asyncFocusRichText(element.host, id)?.catch(console.error);
  } else if (
    matchFlavours(model, ['affine:paragraph']) &&
    model['type'] !== type
  ) {
    addSpace(element, prefix.length);
    doc.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const inlineEditor = getInlineEditorByModel(element.host, model);
    if (inlineEditor) {
      inlineEditor.setInlineRange({
        index: 0,
        length: 0,
      });
    }
    doc.updateBlock(model, { type: type });
  }
  return true;
}

export function convertToDivider(
  element: BlockComponent,
  prefix: string
): boolean {
  const { doc, model } = element;
  if (
    matchFlavours(model, ['affine:divider']) ||
    (matchFlavours(model, ['affine:paragraph']) && model.type === 'quote')
  ) {
    return false;
  }
  if (!matchFlavours(model, ['affine:divider'])) {
    const parent = doc.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    addSpace(element, prefix.length);
    doc.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const blockProps = {
      children: model.children,
    };
    doc.addBlock('affine:divider', blockProps, parent, index);

    const nextBlock = parent.children[index + 1];
    if (nextBlock) {
      asyncFocusRichText(element.host, nextBlock.id)?.catch(console.error);
    } else {
      const nextId = doc.addBlock('affine:paragraph', {}, parent);
      asyncFocusRichText(element.host, nextId)?.catch(console.error);
    }
  }
  return true;
}
