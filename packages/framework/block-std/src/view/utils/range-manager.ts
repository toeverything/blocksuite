import type { TextSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { INLINE_ROOT_ATTR, type InlineRootElement } from '@blocksuite/inline';

import type { BlockElement } from '../element/block-element.js';
import type { EditorHost } from '../element/lit-host.js';
import { RangeBinding } from './range-binding.js';

/**
 * CRUD for Range and TextSelection
 */
export class RangeManager {
  /**
   * Used to mark certain elements so that they are excluded when synchronizing the native range and text selection (such as database block).
   */
  static rangeSyncExcludeAttr = 'data-range-sync-exclude';
  /**
   * Used to exclude certain elements when using `getSelectedBlockElementsByRange`.
   */
  static rangeQueryExcludeAttr = 'data-range-query-exclude';

  readonly binding = new RangeBinding(this);

  constructor(public host: EditorHost) {}

  get value() {
    const selection = document.getSelection();
    assertExists(selection);
    if (selection.rangeCount === 0) return null;
    return selection.getRangeAt(0);
  }

  clear() {
    const selection = document.getSelection();
    assertExists(selection);
    selection.removeAllRanges();

    const topContenteditableElement = this.host.querySelector(
      `[contenteditable="true"]`
    );
    if (topContenteditableElement instanceof HTMLElement) {
      topContenteditableElement.blur();
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  set(range: Range) {
    const selection = document.getSelection();
    assertExists(selection);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  syncTextSelectionToRange(selection: TextSelection) {
    const range = this.textSelectionToRange(selection);
    if (range) {
      this.set(range);
    } else {
      this.clear();
    }
  }

  syncRangeToTextSelection(range: Range, isRangeReversed: boolean) {
    const selectionManager = this.host.selection;

    if (!range) {
      selectionManager.clear(['text']);
      return;
    }

    const textSelection = this.rangeToTextSelection(range, isRangeReversed);
    if (textSelection) {
      selectionManager.setGroup('note', [textSelection]);
    } else {
      selectionManager.clear(['text']);
    }
  }

  /**
   * @example
   * aaa
   *   b[bb
   *     ccc
   * ddd
   *   ee]e
   *
   * all mode: [aaa, bbb, ccc, ddd, eee]
   * flat mode: [bbb, ccc, ddd, eee]
   * highest mode: [bbb, ddd]
   *
   * match function will be evaluated before filtering using mode
   */
  getSelectedBlockElementsByRange(
    range: Range,
    options: {
      match?: (el: BlockElement) => boolean;
      mode?: 'all' | 'flat' | 'highest';
    } = {}
  ): BlockElement[] {
    const { mode = 'all', match = () => true } = options;

    let result = Array.from<BlockElement>(
      this.host.querySelectorAll(
        `[${this.host.blockIdAttr}]:not([${RangeManager.rangeQueryExcludeAttr}="true"])`
      )
    ).filter(el => range.intersectsNode(el) && match(el));

    if (result.length === 0) {
      return [];
    }

    const firstElement = this.getClosestBlock(range.startContainer);
    assertExists(firstElement);

    if (mode === 'flat') {
      result = result.filter(
        el =>
          firstElement.compareDocumentPosition(el) &
            Node.DOCUMENT_POSITION_FOLLOWING || el === firstElement
      );
    } else if (mode === 'highest') {
      let parent = result[0];
      result = result.filter((node, index) => {
        if (index === 0) return true;
        if (
          parent.compareDocumentPosition(node) &
          Node.DOCUMENT_POSITION_CONTAINED_BY
        ) {
          return false;
        } else {
          parent = node;
          return true;
        }
      });
    }

    return result;
  }

  textSelectionToRange(selection: TextSelection): Range | null {
    const { from, to } = selection;

    const fromInlineEditor = this.queryInlineEditorByPath(from.blockId);
    if (!fromInlineEditor) return null;

    if (selection.isInSameBlock()) {
      return fromInlineEditor.toDomRange({
        index: from.index,
        length: from.length,
      });
    } else {
      assertExists(to);
      const toInlineEditor = this.queryInlineEditorByPath(to.blockId);
      if (!toInlineEditor) return null;

      const fromRange = fromInlineEditor.toDomRange({
        index: from.index,
        length: from.length,
      });
      const toRange = toInlineEditor.toDomRange({
        index: to.index,
        length: to.length,
      });

      if (!fromRange || !toRange) return null;

      const range = document.createRange();
      const startContainer = fromRange.startContainer;
      const startOffset = fromRange.startOffset;
      const endContainer = toRange.endContainer;
      const endOffset = toRange.endOffset;
      range.setStart(startContainer, startOffset);
      range.setEnd(endContainer, endOffset);

      return range;
    }
  }

  rangeToTextSelection(range: Range, reverse = false): TextSelection | null {
    const { startContainer, endContainer } = range;

    const startBlock = this.getClosestBlock(startContainer);
    const endBlock = this.getClosestBlock(endContainer);
    if (!startBlock || !endBlock) {
      return null;
    }

    const startInlineEditor = this.getClosestInlineEditor(startContainer);
    const endInlineEditor = this.getClosestInlineEditor(endContainer);
    if (!startInlineEditor || !endInlineEditor) {
      return null;
    }

    const startInlineRange = startInlineEditor.toInlineRange(range);
    const endInlineRange = endInlineEditor.toInlineRange(range);
    if (!startInlineRange || !endInlineRange) {
      return null;
    }

    return this.host.selection.create('text', {
      from: {
        blockId: startBlock.blockId,
        index: startInlineRange.index,
        length: startInlineRange.length,
      },
      to:
        startBlock === endBlock
          ? null
          : {
              blockId: endBlock.blockId,
              index: endInlineRange.index,
              length: endInlineRange.length,
            },
      reverse,
    });
  }

  getClosestBlock(node: Node) {
    const el = node instanceof Element ? node : node.parentElement;
    if (!el) return null;
    const block = el.closest<BlockElement>(`[${this.host.blockIdAttr}]`);
    if (!block) return null;
    if (this._isRangeSyncExcluded(block)) return null;
    return block;
  }

  getClosestInlineEditor(node: Node) {
    const el = node instanceof Element ? node : node.parentElement;
    if (!el) return null;
    const inlineRoot = el.closest<InlineRootElement>(`[${INLINE_ROOT_ATTR}]`);
    if (!inlineRoot) return null;

    if (this._isRangeSyncExcluded(inlineRoot)) return null;

    return inlineRoot.inlineEditor;
  }

  queryInlineEditorByPath(path: string) {
    const block = this.host.view.getBlock(path);
    if (!block) return null;

    const inlineRoot = block.querySelector<InlineRootElement>(
      `[${INLINE_ROOT_ATTR}]`
    );
    if (!inlineRoot) return null;

    if (this._isRangeSyncExcluded(inlineRoot)) return null;

    return inlineRoot.inlineEditor;
  }

  private _isRangeSyncExcluded(el: Element) {
    return !!el.closest(`[${RangeManager.rangeSyncExcludeAttr}="true"]`);
  }
}
