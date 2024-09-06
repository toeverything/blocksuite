import type { RootBlockModel } from '@blocksuite/affine-model';
import type { ExtendedModel } from '@blocksuite/affine-shared/types';
import type { EditorHost } from '@blocksuite/block-std';
import type { BlockModel, Text } from '@blocksuite/store';

import {
  asyncSetInlineRange,
  focusTextModel,
} from '@blocksuite/affine-components/rich-text';
import { EMBED_BLOCK_FLAVOUR_LIST } from '@blocksuite/affine-shared/consts';
import {
  focusTitle,
  getDocTitleInlineEditor,
  getPrevContentBlock,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';

/**
 * Merge the paragraph with prev block
 *
 * Before press backspace
 * - line1
 *   - line2
 *   - |aaa
 *   - line3
 *
 * After press backspace
 * - line1
 *   - line2|aaa
 *   - line3
 */
export function mergeWithPrev(editorHost: EditorHost, model: BlockModel) {
  const doc = model.doc;
  const parent = doc.getParent(model);
  if (!parent) return false;
  const prevBlock = getPrevContentBlock(editorHost, model);
  if (!prevBlock) {
    return handleNoPreviousSibling(editorHost, model);
  }

  if (matchFlavours(prevBlock, ['affine:paragraph', 'affine:list'])) {
    const modelIndex = parent.children.indexOf(model);
    if (
      (modelIndex === -1 || modelIndex === parent.children.length - 1) &&
      parent.role === 'content'
    )
      return false;

    const lengthBeforeJoin = prevBlock.text?.length ?? 0;
    prevBlock.text.join(model.text as Text);
    doc.deleteBlock(model, {
      bringChildrenTo: parent,
    });
    asyncSetInlineRange(editorHost, prevBlock, {
      index: lengthBeforeJoin,
      length: 0,
    }).catch(console.error);
    return true;
  }

  if (
    matchFlavours(prevBlock, [
      'affine:attachment',
      'affine:bookmark',
      'affine:code',
      'affine:image',
      'affine:divider',
      ...EMBED_BLOCK_FLAVOUR_LIST,
    ])
  ) {
    const selection = editorHost.selection.create('block', {
      blockId: prevBlock.id,
    });
    editorHost.selection.setGroup('note', [selection]);

    if (model.text?.length === 0) {
      doc.deleteBlock(model, {
        bringChildrenTo: parent,
      });
    }

    return true;
  }

  if (matchFlavours(prevBlock, ['affine:edgeless-text'])) {
    return true;
  }

  // @ts-ignore TODO: should be fixed after database model is migrated to affine-models
  if (matchFlavours(parent, ['affine:database'])) {
    doc.deleteBlock(model);
    focusTextModel(editorHost.std, prevBlock.id, prevBlock.text?.yText.length);
    return true;
  }

  return false;
}

function handleNoPreviousSibling(editorHost: EditorHost, model: ExtendedModel) {
  const doc = model.doc;
  const text = model.text;
  const parent = doc.getParent(model);
  if (!parent) return false;
  const titleEditor = getDocTitleInlineEditor(editorHost);
  // Probably no title, e.g. in edgeless mode
  if (!titleEditor) {
    if (
      matchFlavours(parent, ['affine:edgeless-text']) ||
      model.children.length > 0
    ) {
      doc.deleteBlock(model, {
        bringChildrenTo: parent,
      });
      return true;
    }
    return false;
  }

  const rootModel = model.doc.root as RootBlockModel;
  const title = rootModel.title;

  doc.captureSync();
  let textLength = 0;
  if (text) {
    textLength = text.length;
    title.join(text);
  }

  // Preserve at least one block to be able to focus on container click
  if (doc.getNext(model) || model.children.length > 0) {
    const parent = doc.getParent(model);
    if (!parent) return false;
    doc.deleteBlock(model, {
      bringChildrenTo: parent,
    });
  } else {
    text?.clear();
  }
  focusTitle(editorHost, title.length - textLength);
  return true;
}
