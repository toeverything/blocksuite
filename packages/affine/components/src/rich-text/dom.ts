import type { EditorHost } from '@blocksuite/block-std';
import type { InlineRange } from '@blocksuite/inline';
import type { BlockModel } from '@blocksuite/store';

import {
  asyncGetBlockComponent,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';

import type { RichText } from './rich-text.js';

/**
 * In most cases, you not need RichText, you can use {@link getInlineEditorByModel} instead.
 */
export function getRichTextByModel(editorHost: EditorHost, id: string) {
  const blockComponent = editorHost.view.getBlock(id);
  const richText = blockComponent?.querySelector<RichText>('rich-text');
  if (!richText) return null;
  return richText;
}

export async function asyncGetRichText(editorHost: EditorHost, id: string) {
  const blockComponent = await asyncGetBlockComponent(editorHost, id);
  if (!blockComponent) return null;
  await blockComponent.updateComplete;
  const richText = blockComponent?.querySelector<RichText>('rich-text');
  if (!richText) return null;
  return richText;
}

export function getInlineEditorByModel(
  editorHost: EditorHost,
  model: BlockModel
) {
  // @ts-ignore TODO: migrate database model to `@blocksuite/affine-model`
  if (matchFlavours(model, ['affine:database'])) {
    // Not support database model since it's may be have multiple inline editor instances.
    // Support to enter the editing state through the Enter key in the database.
    return null;
  }
  const richText = getRichTextByModel(editorHost, model.id);
  if (!richText) return null;
  return richText.inlineEditor;
}

export async function asyncSetInlineRange(
  editorHost: EditorHost,
  model: BlockModel,
  inlineRange: InlineRange
) {
  const richText = await asyncGetRichText(editorHost, model.id);
  if (!richText) {
    return;
  }

  await richText.updateComplete;
  const inlineEditor = richText.inlineEditor;
  if (!inlineEditor) {
    return;
  }
  inlineEditor.setInlineRange(inlineRange);
}

export async function asyncFocusRichText(
  editorHost: EditorHost,
  id: string,
  offset: number = 0
) {
  const selection = editorHost.std.selection;
  selection.setGroup('note', [
    selection.create('text', {
      from: { blockId: id, index: offset, length: 0 },
      to: null,
    }),
  ]);
  await editorHost.updateComplete;
}
