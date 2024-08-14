import type {
  ListProps,
  ListType,
  ParagraphType,
} from '@blocksuite/affine-model';
import type { BlockStdScope } from '@blocksuite/block-std';
import type { InlineEditor } from '@blocksuite/inline';
import type { BlockModel } from '@blocksuite/store';

import { focusTextModel } from '@blocksuite/affine-components/rich-text';
import { matchFlavours } from '@blocksuite/affine-shared/utils';

export function getPrefixText(inlineEditor: InlineEditor) {
  const inlineRange = inlineEditor.getInlineRange();
  if (!inlineRange) return '';
  const firstLineEnd = inlineEditor.yTextString.search(/\n/);
  if (firstLineEnd !== -1 && inlineRange.index > firstLineEnd) {
    return '';
  }
  const textPoint = inlineEditor.getTextPoint(inlineRange.index);
  if (!textPoint) return '';
  const [leafStart, offsetStart] = textPoint;
  return leafStart.textContent
    ? leafStart.textContent.slice(0, offsetStart)
    : '';
}

function beforeConvert(std: BlockStdScope, model: BlockModel, index: number) {
  const { text } = model;
  if (!text) return;
  // Add a space after the text, then stop capturing
  // So when the user undo, the prefix will be restored with a `space`
  // Ex. (| is the cursor position)
  // *| <- user input
  // <space> -> bullet list
  // *<space>| -> undo
  text.insert(' ', index);
  focusTextModel(std, model.id, index + 1);
  std.doc.captureSync();
  text.delete(0, index + 1);
}

export function convertToList(
  std: BlockStdScope,
  model: BlockModel,
  listType: ListType,
  prefix: string,
  otherProperties?: Partial<ListProps>
): boolean {
  if (!matchFlavours(model, ['affine:paragraph'])) {
    return false;
  }
  const { doc } = std;
  const parent = doc.getParent(model);
  if (!parent) return false;

  beforeConvert(std, model, prefix.length);

  if (listType !== 'numbered') {
    const index = parent.children.indexOf(model);
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
    focusTextModel(std, id);
    return true;
  }

  let order = parseInt(prefix.slice(0, -1));
  if (!Number.isInteger(order)) order = 1;

  const { listConvertedId } = std.command.exec('convertToNumberedList', {
    id: model.id,
    order,
    stopCapturing: false,
  });
  if (!listConvertedId) return false;

  focusTextModel(std, listConvertedId);
  return true;
}

export function convertToParagraph(
  std: BlockStdScope,
  model: BlockModel,
  type: ParagraphType,
  prefix: string
): boolean {
  const { doc } = std;
  if (!matchFlavours(model, ['affine:paragraph'])) {
    const parent = doc.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);

    beforeConvert(std, model, prefix.length);

    const blockProps = {
      type: type,
      text: model.text?.clone(),
      children: model.children,
    };
    doc.deleteBlock(model, { deleteChildren: false });
    const id = doc.addBlock('affine:paragraph', blockProps, parent, index);

    focusTextModel(std, id);
    return true;
  }
  if (matchFlavours(model, ['affine:paragraph']) && model.type !== type) {
    beforeConvert(std, model, prefix.length);

    doc.updateBlock(model, { type });

    focusTextModel(std, model.id);
    return true;
  }

  // If the model is already a paragraph with the same type, do nothing
  return true;
}

export function convertToDivider(
  std: BlockStdScope,
  model: BlockModel,
  prefix: string
): boolean {
  const { doc } = std;
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
    beforeConvert(std, model, prefix.length);
    const blockProps = {
      children: model.children,
    };
    doc.addBlock('affine:divider', blockProps, parent, index);

    const nextBlock = parent.children[index + 1];
    let id = nextBlock?.id;
    if (!id) {
      id = doc.addBlock('affine:paragraph', {}, parent);
    }
    focusTextModel(std, id);
  }
  return true;
}

export function convertToCodeBlock(
  std: BlockStdScope,
  model: BlockModel,
  prefixText: string,
  language: string | null
): boolean {
  if (matchFlavours(model, ['affine:paragraph']) && model.type === 'quote') {
    return false;
  }

  const doc = model.doc;
  const parent = doc.getParent(model);
  if (!parent) {
    return false;
  }

  doc.captureSync();
  const index = parent.children.indexOf(model);

  const codeId = doc.addBlock('affine:code', { language }, parent, index);

  if (model.text && model.text.length > prefixText.length) {
    const text = model.text.clone();
    doc.addBlock('affine:paragraph', { text }, parent, index + 1);
    text.delete(0, prefixText.length);
  }
  doc.deleteBlock(model, { bringChildrenTo: parent });

  focusTextModel(std, codeId);

  return true;
}
