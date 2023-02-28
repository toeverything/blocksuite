import { matchFlavours } from '@blocksuite/global/utils';
import type { Page } from '@blocksuite/store';
import type { BaseBlockModel } from '@blocksuite/store';
import type { Quill } from 'quill';

import type { ExtendedModel } from './types.js';

// XXX: workaround quill lifecycle issue
export function asyncFocusRichText(page: Page, id: string, retries = 2) {
  requestAnimationFrame(() => {
    const adapter = page.richTextAdapters.get(id);
    if (adapter) {
      adapter?.quill.focus();
    } else if (retries > 0) {
      asyncFocusRichText(page, id, retries - 1);
    }
  });
}

export function isCollapsedAtBlockStart(quill: Quill) {
  return (
    quill.getSelection(true)?.index === 0 && quill.getSelection()?.length === 0
  );
}

export function doesInSamePath(
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
  listType: 'bulleted' | 'numbered' | 'todo',
  prefix: string,
  otherProperties?: Record<string, unknown>
): boolean {
  if (
    matchFlavours(model, ['affine:list'] as const) &&
    model['type'] === listType
  ) {
    return false;
  }
  if (matchFlavours(model, ['affine:paragraph'] as const)) {
    const parent = page.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    model.text?.insert(' ', prefix.length);
    page.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const blockProps = {
      flavour: 'affine:list',
      type: listType,
      text: model.text?.clone(),
      children: model.children,
      ...otherProperties,
    };
    page.deleteBlock(model);

    const id = page.addBlock(blockProps, parent, index);
    asyncFocusRichText(page, id);
  } else if (
    matchFlavours(model, ['affine:list'] as const) &&
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
  if (!matchFlavours(model, ['affine:paragraph'] as const)) {
    const parent = page.getParent(model);
    if (!parent) return false;

    const index = parent.children.indexOf(model);
    model.text?.insert(' ', prefix.length);
    page.captureSync();

    model.text?.delete(0, prefix.length + 1);
    const blockProps = {
      flavour: 'affine:paragraph',
      type: type,
      text: model.text?.clone(),
      children: model.children,
    };
    page.deleteBlock(model);

    const id = page.addBlock(blockProps, parent, index);
    asyncFocusRichText(page, id);
  } else if (
    matchFlavours(model, ['affine:paragraph'] as const) &&
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
  if (
    matchFlavours(model, ['affine:divider'] as const) ||
    model.type === 'quote'
  ) {
    return false;
  }
  if (!matchFlavours(model, ['affine:divider'] as const)) {
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
