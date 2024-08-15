import type { EditorHost } from '@blocksuite/block-std';
import type { BlockModel } from '@blocksuite/store';

import { matchFlavours } from './model.js';

/**
 *
 * @example
 * ```md
 * doc
 * - note
 *   - paragraph <- 5
 * - note <- 4 (will be skipped)
 *  - paragraph <- 3
 *    - child <- 2
 *      - child <- 1
 *  - paragraph <- when invoked here, the traverse order will be above
 * ```
 *
 * NOTE: this method will just return blocks with `content` role
 */
export function getPrevContentBlock(
  editorHost: EditorHost,
  model: BlockModel
): BlockModel | null {
  const getPrev = (model: BlockModel) => {
    const parent = model.doc.getParent(model);
    if (!parent) return null;

    const index = parent.children.indexOf(model);
    if (index > 0) {
      let prev = parent.children[index - 1];
      while (prev.children.length > 0) {
        prev = prev.children[prev.children.length - 1];
      }
      return prev;
    }

    // in edgeless mode, limit search for the previous block within the same note
    if (
      // FIXME: this is a workaround to check if the editor is in edgeless mode
      // We should use service to check if the editor is in edgeless mode
      isInsideEdgelessEditor(editorHost) &&
      parent.role === 'hub'
    ) {
      return null;
    }

    return parent;
  };

  const map: Record<string, true> = {};
  const iterate: (model: BlockModel) => BlockModel | null = (
    model: BlockModel
  ) => {
    if (model.id in map) {
      console.error(
        "Can't get previous block! There's a loop in the block tree!"
      );
      return null;
    }
    map[model.id] = true;

    const prev = getPrev(model);
    if (prev) {
      if (prev.role === 'content' && !matchFlavours(prev, ['affine:frame'])) {
        return prev;
      } else {
        return iterate(prev);
      }
    } else {
      return null;
    }
  };

  return iterate(model);
}

/**
 *
 * @example
 * ```md
 * page
 * - note
 *  - paragraph <- when invoked here, the traverse order will be following
 *    - child <- 1
 *  - sibling <- 2
 * - note <- 3 (will be skipped)
 *   - paragraph <- 4
 * ```
 *
 * NOTE: this method will skip the `affine:note` block
 */
export function getNextContentBlock(
  editorHost: EditorHost,
  model: BlockModel,
  map: Record<string, true> = {}
): BlockModel | null {
  if (model.id in map) {
    console.error("Can't get next block! There's a loop in the block tree!");
    return null;
  }
  map[model.id] = true;

  const doc = model.doc;
  if (model.children.length) {
    return model.children[0];
  }
  let currentBlock: typeof model | null = model;
  while (currentBlock) {
    const nextSibling = doc.getNext(currentBlock);
    if (nextSibling) {
      // Assert nextSibling is not possible to be `affine:page`
      if (model.role === 'hub') {
        // in edgeless mode, limit search for the next block within the same note
        if (isInsideEdgelessEditor(editorHost)) {
          return null;
        }

        return getNextContentBlock(editorHost, nextSibling);
      }
      return nextSibling;
    }
    currentBlock = doc.getParent(currentBlock);
  }
  return null;
}

function isInsideEdgelessEditor(host: EditorHost) {
  return Array.from(host.children).some(
    v => v.tagName.toLowerCase() === 'affine-edgeless-root'
  );
}
