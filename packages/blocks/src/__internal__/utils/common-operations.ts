import type { Space } from '@blocksuite/store';
import Quill from 'quill';
import type { ExtendedModel } from './types';

// XXX: workaround quill lifecycle issue
export function asyncFocusRichText(space: Space, id: string) {
  setTimeout(() => {
    const adapter = space.richTextAdapters.get(id);
    adapter?.quill.focus();
  });
}

export function isCollapsedAtBlockStart(quill: Quill) {
  return (
    quill.getSelection(true)?.index === 0 && quill.getSelection()?.length === 0
  );
}

export function convertToList(
  space: Space,
  model: ExtendedModel,
  listType: 'bulleted' | 'numbered' | 'todo',
  prefix: string,
  otherProperties?: Record<string, unknown>
): boolean {
  if (model.flavour === 'affine:list' && model['type'] === listType) {
    return false;
  }
  if (model.flavour === 'affine:paragraph') {
    const parent = space.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    model.text?.insert(' ', prefix.length);
    space.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const blockProps = {
      flavour: 'affine:list',
      type: listType,
      text: model?.text?.clone(),
      children: model.children,
      ...otherProperties,
    };
    space.deleteBlock(model);

    const id = space.addBlock(blockProps, parent, index);
    asyncFocusRichText(space, id);
  } else if (model.flavour === 'affine:list' && model['type'] !== listType) {
    model.text?.insert(' ', prefix.length);
    space.captureSync();

    model.text?.delete(0, prefix.length + 1);
    space.updateBlock(model, { type: listType });
  }
  return true;
}

export function convertToParagraph(
  space: Space,
  model: ExtendedModel,
  type: 'affine:paragraph' | 'quote' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
  prefix: string
): boolean {
  if (model.flavour === 'affine:paragraph' && model['type'] === type) {
    return false;
  }
  if (model.flavour !== 'affine:paragraph') {
    const parent = space.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    model.text?.insert(' ', prefix.length);
    space.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const blockProps = {
      flavour: 'affine:paragraph',
      type: type,
      text: model?.text?.clone(),
      children: model.children,
    };
    space.deleteBlock(model);

    const id = space.addBlock(blockProps, parent, index);
    asyncFocusRichText(space, id);
  } else if (model.flavour === 'affine:paragraph' && model['type'] !== type) {
    model.text?.insert(' ', prefix.length);
    space.captureSync();

    model.text?.delete(0, prefix.length + 1);
    space.updateBlock(model, { type: type });
  }
  return true;
}

export function addDivider(
  quill: Quill,
  model: ExtendedModel,
  prefix: string,
  space: Space
): boolean {
  model.text?.insert(' ', prefix.length);
  space.captureSync();
  model.text?.delete(0, prefix.length + 1);
  const BlockEmbed = Quill.import('blots/block/embed');

  class DividerBlot extends BlockEmbed {}
  DividerBlot.blotName = 'divider';
  DividerBlot.tagName = 'hr';
  Quill.register(DividerBlot);

  const range = quill.getSelection(true);
  quill.insertText(range.index, '\n', Quill.sources.USER);
  quill.insertEmbed(range.index, 'divider', true, Quill.sources.USER);
  quill.setSelection(range.index + 1, 0, Quill.sources.SILENT);

  return true;
}
