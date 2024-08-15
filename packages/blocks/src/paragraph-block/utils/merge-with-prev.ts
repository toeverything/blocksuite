import type { EditorHost } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';
import type { Text } from '@blocksuite/store';

import {
  asyncSetInlineRange,
  focusTextModel,
} from '@blocksuite/affine-components/rich-text';
import { EMBED_BLOCK_FLAVOUR_LIST } from '@blocksuite/affine-shared/consts';
import {
  getPrevContentBlock,
  matchFlavours,
} from '@blocksuite/affine-shared/utils';

import { handleNoPreviousSibling } from '../../_common/components/rich-text/rich-text-operations.js';

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

  if (matchFlavours(parent, ['affine:database'])) {
    doc.deleteBlock(model);
    focusTextModel(editorHost.std, prevBlock.id, prevBlock.text?.yText.length);
    return true;
  }

  return false;
}
