import type { BlockStdScope, EditorHost } from '@blocksuite/block-std';
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
  model: BlockModel | string
) {
  const blockModel =
    typeof model === 'string'
      ? editorHost.std.doc.getBlock(model)?.model
      : model;
  // @ts-ignore TODO: migrate database model to `@blocksuite/affine-model`
  if (!blockModel || matchFlavours(blockModel, ['affine:database'])) {
    // Not support database model since it's may be have multiple inline editor instances.
    // Support to enter the editing state through the Enter key in the database.
    return null;
  }
  const richText = getRichTextByModel(editorHost, blockModel.id);
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

export function focusTextModel(
  std: BlockStdScope,
  id: string,
  offset: number = 0
) {
  selectTextModel(std, id, offset);
}

export function selectTextModel(
  std: BlockStdScope,
  id: string,
  index: number = 0,
  length: number = 0
) {
  const { selection } = std;
  selection.setGroup('note', [
    selection.create('text', {
      from: { blockId: id, index, length },
      to: null,
    }),
  ]);
}
