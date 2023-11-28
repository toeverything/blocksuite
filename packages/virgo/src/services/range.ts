import { assertExists } from '@blocksuite/global/utils';

import type { VirgoLine } from '../components/virgo-line.js';
import type { TextPoint, VRange, VRangeUpdatedProp } from '../types.js';
import type { BaseTextAttributes } from '../utils/base-attributes.js';
import { findDocumentOrShadowRoot } from '../utils/query.js';
import {
  domRangeToVirgoRange,
  virgoRangeToDomRange,
} from '../utils/range-conversion.js';
import { calculateTextLength, getTextNodesFromElement } from '../utils/text.js';
import { isMaybeVRangeEqual } from '../utils/v-range.js';
import type { VEditor } from '../virgo.js';

export class VirgoRangeService<TextAttributes extends BaseTextAttributes> {
  private _vRange: VRange | null = null;

  constructor(public readonly editor: VEditor<TextAttributes>) {}

  get vRangeProvider() {
    return this.editor.vRangeProvider;
  }

  get rootElement() {
    return this.editor.rootElement;
  }

  onVRangeUpdated = async ([newVRange, sync]: VRangeUpdatedProp) => {
    const eq = isMaybeVRangeEqual(this._vRange, newVRange);
    if (eq) {
      return;
    }

    this._vRange = newVRange;

    // try to trigger update because the `selected` state of the virgo element may change
    if (this.editor.mounted) {
      // range change may happen before the editor is prepared
      await this.editor.waitForUpdate();
      this.editor.requestUpdate(false);
    }

    if (!sync) {
      return;
    }

    if (this._vRange === null) {
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
      // so we need to obtain the latest vRange.
      // see https://github.com/toeverything/blocksuite/issues/2982
      // when using input method _vRange will return to the starting point,
      // so we need to re-sync
      this.syncVRange();
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

  getVRange = (): VRange | null => {
    if (this.vRangeProvider) {
      return this.vRangeProvider.getVRange();
    }

    return this._vRange;
  };

  getVRangeFromElement = (element: Element): VRange | null => {
    const range = document.createRange();
    const text = element.querySelector('[data-virgo-text');
    if (!text) {
      return null;
    }
    const textNode = text.childNodes[1];
    assertExists(textNode instanceof Text);
    range.setStart(textNode, 0);
    range.setEnd(textNode, textNode.textContent?.length ?? 0);
    const vRange = this.toVRange(range);
    return vRange;
  };

  getTextPoint(rangeIndex: VRange['index']): TextPoint {
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

  // the number is related to the VirgoLine's textLength
  getLine(rangeIndex: VRange['index']): readonly [VirgoLine, number] {
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

  isVRangeValid = (vRange: VRange | null): boolean => {
    return !(
      vRange &&
      (vRange.index < 0 ||
        vRange.index + vRange.length > this.editor.yText.length)
    );
  };

  /**
   * There are two cases to have the second line:
   * 1. long text auto wrap in span element
   * 2. soft break
   */
  isFirstLine = (vRange: VRange | null): boolean => {
    if (!vRange) return false;

    if (vRange.length > 0) {
      throw new Error('vRange should be collapsed');
    }

    const range = this.toDomRange(vRange);
    if (!range) {
      throw new Error('failed to convert vRange to domRange');
    }

    // check case 1:
    const beforeText = this.editor.yTextString.slice(0, vRange.index);
    if (beforeText.includes('\n')) {
      return false;
    }

    // check case 2:
    // If there is a wrapped text, there are two possible positions for
    // cursor: (in first line and in second line)
    // aaaaaaaa| or aaaaaaaa
    // bb           |bb
    // We have no way to distinguish them and we just assume that the cursor
    // can not in the first line because if we apply the vRange manually the
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
  isLastLine = (vRange: VRange | null): boolean => {
    if (!vRange) return false;

    if (vRange.length > 0) {
      throw new Error('vRange should be collapsed');
    }

    // check case 1:
    const afterText = this.editor.yTextString.slice(vRange.index);
    if (afterText.includes('\n')) {
      return false;
    }

    const range = this.toDomRange(vRange);
    if (!range) {
      throw new Error('failed to convert vRange to domRange');
    }

    // check case 2:
    // If there is a wrapped text, there are two possible positions for
    // cursor: (in first line and in second line)
    // aaaaaaaa| or aaaaaaaa
    // bb           |bb
    // We have no way to distinguish them and we just assume that the cursor
    // can not in the first line because if we apply the vRange manually the
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
   * the vRange is synced to the native selection asynchronically
   * if sync is true, the native selection will be synced immediately
   */
  setVRange = (vRange: VRange | null, sync = true): void => {
    if (!this.isVRangeValid(vRange)) {
      throw new Error('invalid vRange');
    }

    if (this.vRangeProvider) {
      this.vRangeProvider.setVRange(vRange, sync);
      return;
    }

    this.editor.slots.vRangeUpdated.emit([vRange, sync]);
  };

  focusEnd = (): void => {
    this.setVRange({
      index: this.editor.yTextLength,
      length: 0,
    });
  };

  focusStart = (): void => {
    this.setVRange({
      index: 0,
      length: 0,
    });
  };

  selectAll = (): void => {
    this.setVRange({
      index: 0,
      length: this.editor.yTextLength,
    });
  };

  focusIndex = (index: number): void => {
    this.setVRange({
      index,
      length: 0,
    });
  };

  /**
   * sync the dom selection from vRange for **this Editor**
   */
  syncVRange = (): void => {
    const vRange = this.getVRange();
    if (vRange && this.editor.mounted) {
      this._applyVRange(vRange);
    }
  };

  /**
   * calculate the dom selection from vRange for **this Editor**
   */
  toDomRange = (vRange: VRange): Range | null => {
    const rootElement = this.editor.rootElement;
    return virgoRangeToDomRange(rootElement, vRange);
  };

  /**
   * calculate the vRange from dom selection for **this Editor**
   * there are three cases when the vRange of this Editor is not null:
   * (In the following, "|" mean anchor and focus, each line is a separate Editor)
   * 1. anchor and focus are in this Editor
   *    aaaaaa
   *    b|bbbb|b
   *    cccccc
   *    the vRange of second Editor is {index: 1, length: 4}, the others are null
   * 2. anchor and focus one in this Editor, one in another Editor
   *    aaa|aaa    aaaaaa
   *    bbbbb|b or bbbbb|b
   *    cccccc     cc|cccc
   *    2.1
   *        the vRange of first Editor is {index: 3, length: 3}, the second is {index: 0, length: 5},
   *        the third is null
   *    2.2
   *        the vRange of first Editor is null, the second is {index: 5, length: 1},
   *        the third is {index: 0, length: 2}
   * 3. anchor and focus are in another Editor
   *    aa|aaaa
   *    bbbbbb
   *    cccc|cc
   *    the vRange of first Editor is {index: 2, length: 4},
   *    the second is {index: 0, length: 6}, the third is {index: 0, length: 4}
   */
  toVRange = (range: Range): VRange | null => {
    const { rootElement, yText } = this.editor;

    return domRangeToVirgoRange(range, rootElement, yText);
  };

  private _applyVRange = (vRange: VRange): void => {
    const selectionRoot = findDocumentOrShadowRoot(this.editor);
    const selection = selectionRoot.getSelection();
    if (!selection) {
      return;
    }
    const newRange = this.toDomRange(vRange);

    if (!newRange) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(newRange);
    this.editor.slots.rangeUpdated.emit(newRange);
  };
}
