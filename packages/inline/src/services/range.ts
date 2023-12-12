import { assertExists } from '@blocksuite/global/utils';

import type { VLine } from '../components/v-line.js';
import type { InlineEditor } from '../inline-editor.js';
import type {
  InlineRange,
  InlineRangeUpdatedProp,
  TextPoint,
} from '../types.js';
import type { BaseTextAttributes } from '../utils/base-attributes.js';
import { isMaybeInlineRangeEqual } from '../utils/inline-range.js';
import { findDocumentOrShadowRoot } from '../utils/query.js';
import {
  domRangeToInlineRange,
  inlineRangeToDomRange,
} from '../utils/range-conversion.js';
import { calculateTextLength, getTextNodesFromElement } from '../utils/text.js';

export class RangeService<TextAttributes extends BaseTextAttributes> {
  private _inlineRange: InlineRange | null = null;

  constructor(public readonly editor: InlineEditor<TextAttributes>) {}

  get inlineRangeProvider() {
    return this.editor.inlineRangeProvider;
  }

  get rootElement() {
    return this.editor.rootElement;
  }

  onInlineRangeUpdated = async ([
    newInlineRange,
    sync,
  ]: InlineRangeUpdatedProp) => {
    const eq = isMaybeInlineRangeEqual(this._inlineRange, newInlineRange);
    if (eq) {
      return;
    }

    this._inlineRange = newInlineRange;

    // try to trigger update because the `selected` state of inline editor element may change
    if (this.editor.mounted) {
      // range change may happen before the editor is prepared
      await this.editor.waitForUpdate();
      this.editor.requestUpdate(false);
    }

    if (!sync) {
      return;
    }

    if (this._inlineRange === null) {
      const selectionRoot = findDocumentOrShadowRoot(this.editor);
      const selection = selectionRoot.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (range.intersectsNode(this.editor.rootElement)) {
          selection.removeAllRanges();
        }
      }
      return;
    }

    const fn = () => {
      // There may be multiple range update events in one frame,
      // so we need to obtain the latest inline ranage.
      // see https://github.com/toeverything/blocksuite/issues/2982
      // when using input method inline ranage will return to the starting point,
      // so we need to re-sync
      this.syncInlineRange();
    };

    // updates in lit are performed asynchronously
    requestAnimationFrame(fn);
  };

  getNativeSelection(): Selection | null {
    const selectionRoot = findDocumentOrShadowRoot(this.editor);
    const selection = selectionRoot.getSelection();
    if (!selection) return null;
    if (selection.rangeCount === 0) return null;

    return selection;
  }

  getInlineRange = (): InlineRange | null => {
    if (this.inlineRangeProvider) {
      return this.inlineRangeProvider.getInlineRange();
    }

    return this._inlineRange;
  };

  getInlineRangeFromElement = (element: Element): InlineRange | null => {
    const range = document.createRange();
    const text = element.querySelector('[data-v-text');
    if (!text) {
      return null;
    }
    const textNode = text.childNodes[1];
    assertExists(textNode instanceof Text);
    range.setStart(textNode, 0);
    range.setEnd(textNode, textNode.textContent?.length ?? 0);
    const inlineRange = this.toInlineRange(range);
    return inlineRange;
  };

  getTextPoint(rangeIndex: InlineRange['index']): TextPoint {
    const vLines = Array.from(this.rootElement.querySelectorAll('v-line'));

    let index = 0;
    for (const vLine of vLines) {
      const texts = getTextNodesFromElement(vLine);

      for (const text of texts) {
        if (!text.textContent) {
          throw new Error('text element should have textContent');
        }
        if (index + text.textContent.length >= rangeIndex) {
          return [text, rangeIndex - index];
        }
        index += calculateTextLength(text);
      }

      index += 1;
    }

    throw new Error('failed to find leaf');
  }

  // the number is related to the VLine's textLength
  getLine(rangeIndex: InlineRange['index']): readonly [VLine, number] {
    const lineElements = Array.from(
      this.rootElement.querySelectorAll('v-line')
    );

    let index = 0;
    for (const lineElement of lineElements) {
      if (rangeIndex >= index && rangeIndex <= index + lineElement.textLength) {
        return [lineElement, rangeIndex - index] as const;
      }
      if (
        rangeIndex === index + lineElement.textLength &&
        rangeIndex === this.editor.yTextLength
      ) {
        return [lineElement, rangeIndex - index] as const;
      }
      index += lineElement.textLength + 1;
    }

    throw new Error('failed to find line');
  }

  isValidInlineRange = (inlineRange: InlineRange | null): boolean => {
    return !(
      inlineRange &&
      (inlineRange.index < 0 ||
        inlineRange.index + inlineRange.length > this.editor.yText.length)
    );
  };

  /**
   * There are two cases to have the second line:
   * 1. long text auto wrap in span element
   * 2. soft break
   */
  isFirstLine = (inlineRange: InlineRange | null): boolean => {
    if (!inlineRange) return false;

    if (inlineRange.length > 0) {
      throw new Error('Inline range should be collapsed');
    }

    const range = this.toDomRange(inlineRange);
    if (!range) {
      throw new Error('failed to convert inline range to domRange');
    }

    // check case 1:
    const beforeText = this.editor.yTextString.slice(0, inlineRange.index);
    if (beforeText.includes('\n')) {
      return false;
    }

    // check case 2:
    // If there is a wrapped text, there are two possible positions for
    // cursor: (in first line and in second line)
    // aaaaaaaa| or aaaaaaaa
    // bb           |bb
    // We have no way to distinguish them and we just assume that the cursor
    // can not in the first line because if we apply the inline ranage manually the
    // cursor will jump to the second line.
    const container = range.commonAncestorContainer.parentElement;
    assertExists(container);
    const containerRect = container.getBoundingClientRect();
    // There will be two rects if the cursor is at the edge of the line:
    // aaaaaaaa| or aaaaaaaa
    // bb           |bb
    const rangeRects = range.getClientRects();
    // We use last rect here to make sure we get the second rect.
    // (Based on the assumption that the cursor can not in the first line)
    const rangeRect = rangeRects[rangeRects.length - 1];
    return rangeRect.top === containerRect.top;
  };

  /**
   * There are two cases to have the second line:
   * 1. long text auto wrap in span element
   * 2. soft break
   */
  isLastLine = (inlineRange: InlineRange | null): boolean => {
    if (!inlineRange) return false;

    if (inlineRange.length > 0) {
      throw new Error('Inline range should be collapsed');
    }

    // check case 1:
    const afterText = this.editor.yTextString.slice(inlineRange.index);
    if (afterText.includes('\n')) {
      return false;
    }

    const range = this.toDomRange(inlineRange);
    if (!range) {
      throw new Error('failed to convert inline range to domRange');
    }

    // check case 2:
    // If there is a wrapped text, there are two possible positions for
    // cursor: (in first line and in second line)
    // aaaaaaaa| or aaaaaaaa
    // bb           |bb
    // We have no way to distinguish them and we just assume that the cursor
    // can not in the first line because if we apply the inline ranage manually the
    // cursor will jump to the second line.
    const container = range.commonAncestorContainer.parentElement;
    assertExists(container);
    const containerRect = container.getBoundingClientRect();
    // There will be two rects if the cursor is at the edge of the line:
    // aaaaaaaa| or aaaaaaaa
    // bb           |bb
    const rangeRects = range.getClientRects();
    // We use last rect here to make sure we get the second rect.
    // (Based on the assumption that the cursor can not in the first line)
    const rangeRect = rangeRects[rangeRects.length - 1];
    return rangeRect.bottom === containerRect.bottom;
  };

  /**
   * the inline ranage is synced to the native selection asynchronically
   * if sync is true, the native selection will be synced immediately
   */
  setInlineRange = (inlineRange: InlineRange | null, sync = true): void => {
    if (!this.isValidInlineRange(inlineRange)) {
      throw new Error('invalid inline range');
    }

    if (this.inlineRangeProvider) {
      this.inlineRangeProvider.setInlineRange(inlineRange, sync);
      return;
    }

    this.editor.slots.inlineRangeUpdated.emit([inlineRange, sync]);
  };

  focusEnd = (): void => {
    this.setInlineRange({
      index: this.editor.yTextLength,
      length: 0,
    });
  };

  focusStart = (): void => {
    this.setInlineRange({
      index: 0,
      length: 0,
    });
  };

  selectAll = (): void => {
    this.setInlineRange({
      index: 0,
      length: this.editor.yTextLength,
    });
  };

  focusIndex = (index: number): void => {
    this.setInlineRange({
      index,
      length: 0,
    });
  };

  /**
   * sync the dom selection from inline ranage for **this Editor**
   */
  syncInlineRange = (): void => {
    const inlineRange = this.getInlineRange();
    if (inlineRange && this.editor.mounted) {
      this._applyInlineRange(inlineRange);
    }
  };

  /**
   * calculate the dom selection from inline ranage for **this Editor**
   */
  toDomRange = (inlineRange: InlineRange): Range | null => {
    const rootElement = this.editor.rootElement;
    return inlineRangeToDomRange(rootElement, inlineRange);
  };

  /**
   * calculate the inline ranage from dom selection for **this Editor**
   * there are three cases when the inline ranage of this Editor is not null:
   * (In the following, "|" mean anchor and focus, each line is a separate Editor)
   * 1. anchor and focus are in this Editor
   *    aaaaaa
   *    b|bbbb|b
   *    cccccc
   *    the inline ranage of second Editor is {index: 1, length: 4}, the others are null
   * 2. anchor and focus one in this Editor, one in another Editor
   *    aaa|aaa    aaaaaa
   *    bbbbb|b or bbbbb|b
   *    cccccc     cc|cccc
   *    2.1
   *        the inline ranage of first Editor is {index: 3, length: 3}, the second is {index: 0, length: 5},
   *        the third is null
   *    2.2
   *        the inline ranage of first Editor is null, the second is {index: 5, length: 1},
   *        the third is {index: 0, length: 2}
   * 3. anchor and focus are in another Editor
   *    aa|aaaa
   *    bbbbbb
   *    cccc|cc
   *    the inline range of first Editor is {index: 2, length: 4},
   *    the second is {index: 0, length: 6}, the third is {index: 0, length: 4}
   */
  toInlineRange = (range: Range): InlineRange | null => {
    const { rootElement, yText } = this.editor;

    return domRangeToInlineRange(range, rootElement, yText);
  };

  private _applyInlineRange = (inlineRange: InlineRange): void => {
    const selectionRoot = findDocumentOrShadowRoot(this.editor);
    const selection = selectionRoot.getSelection();
    if (!selection) {
      return;
    }
    const newRange = this.toDomRange(inlineRange);

    if (!newRange) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(newRange);
    this.editor.slots.rangeUpdated.emit(newRange);
  };
}
