import { DatabaseBlockModel } from '@blocksuite/affine-model';
import {
  asyncGetBlockComponent,
  getCurrentNativeRange,
  matchModels,
} from '@blocksuite/affine-shared/utils';
import {
  type BlockStdScope,
  type EditorHost,
  TextSelection,
} from '@blocksuite/block-std';
import type { InlineEditor, InlineRange } from '@blocksuite/inline';
import { BlockModel } from '@blocksuite/store';

import type { AffineInlineEditor } from './inline/index.js';
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
      ? editorHost.std.store.getBlock(model)?.model
      : model;
  if (!blockModel || matchModels(blockModel, [DatabaseBlockModel])) {
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
    selection.create(TextSelection, {
      from: { blockId: id, index, length },
      to: null,
    }),
  ]);
}

export async function onModelTextUpdated(
  editorHost: EditorHost,
  model: BlockModel,
  callback?: (text: RichText) => void
) {
  const richText = await asyncGetRichText(editorHost, model.id);
  if (!richText) {
    console.error('RichText is not ready yet.');
    return;
  }
  await richText.updateComplete;
  const inlineEditor = richText.inlineEditor;
  if (!inlineEditor) {
    console.error('Inline editor is not ready yet.');
    return;
  }
  const subscription = inlineEditor.slots.renderComplete.subscribe(() => {
    subscription.unsubscribe();
    if (callback) {
      callback(richText);
    }
  });
}

/**
 * Remove specified text from the current range.
 */
export function cleanSpecifiedTail(
  editorHost: EditorHost,
  inlineEditorOrModel: AffineInlineEditor | BlockModel,
  str: string
) {
  if (!str) {
    console.warn('Failed to clean text! Unexpected empty string');
    return;
  }
  const inlineEditor =
    inlineEditorOrModel instanceof BlockModel
      ? getInlineEditorByModel(editorHost, inlineEditorOrModel)
      : inlineEditorOrModel;
  if (!inlineEditor) {
    return;
  }
  const inlineRange = inlineEditor.getInlineRange();
  if (!inlineRange) {
    return;
  }
  const idx = inlineRange.index - str.length;
  const textStr = inlineEditor.yText.toString().slice(idx, idx + str.length);
  if (textStr !== str) {
    console.warn(
      `Failed to clean text! Text mismatch expected: ${str} but actual: ${textStr}`
    );
    return;
  }
  inlineEditor.deleteText({ index: idx, length: str.length });
  inlineEditor.setInlineRange({
    index: idx,
    length: 0,
  });
}

export function getTextContentFromInlineRange(
  inlineEditor: InlineEditor,
  startRange: InlineRange | null
) {
  const nativeRange = getCurrentNativeRange();
  if (!nativeRange) {
    return null;
  }
  if (nativeRange.startContainer !== nativeRange.endContainer) {
    return null;
  }
  const curRange = inlineEditor.getInlineRange();
  if (!startRange || !curRange) {
    return null;
  }
  if (curRange.index < startRange.index) {
    return null;
  }
  const text = inlineEditor.yText.toString();
  return text.slice(startRange.index, curRange.index);
}
