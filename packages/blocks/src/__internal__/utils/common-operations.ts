import type { Page } from '@blocksuite/store';
import type { Quill } from 'quill';
import { matchFlavours, sleep } from './std.js';
import type { ExtendedModel } from './types.js';
import type { BaseBlockModel } from '@blocksuite/store';

// XXX: workaround quill lifecycle issue
export async function asyncFocusRichText(page: Page, id: string) {
  await sleep();
  const adapter = page.richTextAdapters.get(id);
  adapter?.quill.focus();
}

export function isCollapsedAtBlockStart(quill: Quill) {
  return (
    quill.getSelection(true)?.index === 0 && quill.getSelection()?.length === 0
  );
}

export function doesInSamePath(
  page: Page,
  model: BaseBlockModel,
  target: BaseBlockModel
): boolean {
  if (model === target) {
    return true;
  }
  const doesInSamePathImpl = (
    model: BaseBlockModel,
    target: BaseBlockModel
  ) => {
    let parent: BaseBlockModel | null;
    for (;;) {
      parent = page.getParent(model);
      if (parent === null) {
        return false;
      } else if (parent.id === target.id) {
        return true;
      }
      model = parent;
    }
  };
  return doesInSamePathImpl(model, target) || doesInSamePathImpl(target, model);
}

export function convertToList(
  page: Page,
  model: ExtendedModel,
  listType: 'bulleted' | 'numbered' | 'todo',
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
      flavour: 'affine:list',
      type: listType,
      text: model?.text?.clone(),
      children: model.children,
      ...otherProperties,
    };
    page.deleteBlock(model);

    const id = page.addBlock(blockProps, parent, index);
    asyncFocusRichText(page, id);
  } else if (
    matchFlavours(model, ['affine:list']) &&
    model['type'] !== listType
  ) {
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
      flavour: 'affine:paragraph',
      type: type,
      text: model?.text?.clone(),
      children: model.children,
    };
    page.deleteBlock(model);

    const id = page.addBlock(blockProps, parent, index);
    asyncFocusRichText(page, id);
  } else if (
    matchFlavours(model, ['affine:paragraph']) &&
    model['type'] !== type
  ) {
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
  prefix: string
): boolean {
  if (matchFlavours(model, ['affine:divider'])) {
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
      flavour: 'affine:divider',
      children: model.children,
    };
    // space.deleteBlock(model);
    page.addBlock(blockProps, parent, index);
    const id = page.id;
    asyncFocusRichText(page, id);
  }
  return true;
}
