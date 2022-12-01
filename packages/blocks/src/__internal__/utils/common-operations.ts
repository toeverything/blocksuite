import type { Page } from '@blocksuite/store';
import type { Quill } from 'quill';
import type { ExtendedModel } from './types';

// XXX: workaround quill lifecycle issue
export function asyncFocusRichText(page: Page, id: string) {
  setTimeout(() => {
    const adapter = page.richTextAdapters.get(id);
    adapter?.quill.focus();
  });
}

export function isCollapsedAtBlockStart(quill: Quill) {
  return (
    quill.getSelection(true)?.index === 0 && quill.getSelection()?.length === 0
  );
}

export function convertToList(
  page: Page,
  model: ExtendedModel,
  listType: 'bulleted' | 'numbered' | 'todo',
  prefix: string,
  otherProperties?: Record<string, unknown>
): boolean {
  if (model.flavour === 'affine:list' && model['type'] === listType) {
    return false;
  }
  if (model.flavour === 'affine:paragraph') {
    const parent = page.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    model.text?.insert(' ', prefix.length);
    page.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const blockProps = {
      flavour: 'affine:list',
      type: listType,
      text: model?.text?.clone(),
      children: model.children,
      ...otherProperties,
    };
    page.deleteBlock(model);

    const id = page.addBlock(blockProps, parent, index);
    asyncFocusRichText(page, id);
  } else if (model.flavour === 'affine:list' && model['type'] !== listType) {
    model.text?.insert(' ', prefix.length);
    page.captureSync();

    model.text?.delete(0, prefix.length + 1);
    page.updateBlock(model, { type: listType });
  }
  return true;
}

export function convertToParagraph(
  page: Page,
  model: ExtendedModel,
  type: 'affine:paragraph' | 'quote' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
  prefix: string
): boolean {
  if (model.flavour === 'affine:paragraph' && model['type'] === type) {
    return false;
  }
  if (model.flavour !== 'affine:paragraph') {
    const parent = page.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    model.text?.insert(' ', prefix.length);
    page.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const blockProps = {
      flavour: 'affine:paragraph',
      type: type,
      text: model?.text?.clone(),
      children: model.children,
    };
    page.deleteBlock(model);

    const id = page.addBlock(blockProps, parent, index);
    asyncFocusRichText(page, id);
  } else if (model.flavour === 'affine:paragraph' && model['type'] !== type) {
    model.text?.insert(' ', prefix.length);
    page.captureSync();

    model.text?.delete(0, prefix.length + 1);
    page.updateBlock(model, { type: type });
  }
  return true;
}

export function convertToDivider(
  page: Page,
  model: ExtendedModel,
  type: 'affine:divider' | 'normal',
  prefix: string
): boolean {
  if (model.flavour === 'affine:divider' && model['type'] === type) {
    return false;
  }
  if (model.flavour !== 'affine:divider') {
    const parent = page.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    model.text?.insert(' ', prefix.length);
    page.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const blockProps = {
      flavour: 'affine:divider',
      type: type,
      text: model?.text?.clone(),
      children: model.children,
    };
    // space.deleteBlock(model);
    page.addBlock(blockProps, parent, index);
    const id = page.id;
    asyncFocusRichText(page, id);
  }
  return true;
}
