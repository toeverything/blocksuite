import { VirgoLine } from '../components/index.js';
import type { VRange } from '../types.js';
import type { VRangeUpdatedProp } from '../types.js';
import {
  type BaseTextAttributes,
  domRangeToVirgoRange,
  findDocumentOrShadowRoot,
  virgoRangeToDomRange,
} from '../utils/index.js';
import type { VEditor } from '../virgo.js';

export class VirgoRangeService<TextAttributes extends BaseTextAttributes> {
  private readonly _editor: VEditor<TextAttributes>;

  private _vRange: VRange | null = null;
  private _lastScrollLeft = 0;

  constructor(editor: VEditor<TextAttributes>) {
    this._editor = editor;
  }

  onVRangeUpdated = ([newVRange, origin]: VRangeUpdatedProp) => {
    this._vRange = newVRange;
    document.dispatchEvent(new CustomEvent('virgo-vrange-updated'));

    if (origin !== 'other') {
      return;
    }

    const fn = () => {
      // There may be multiple range update events in one frame,
      // so we need to obtain the latest vRange.
      // see https://github.com/toeverything/blocksuite/issues/2982
      if (this._vRange) {
        // when using input method _vRange will return to the starting point,
        // so we need to re-sync
        this._applyVRange(this._vRange);
      }
    };

    // updates in lit are performed asynchronously
    requestAnimationFrame(fn);
  };

  getVRange = (): VRange | null => {
    return this._vRange;
  };

  /**
   * the vRange is synced to the native selection asynchronically
   */
  setVRange = (vRange: VRange): void => {
    this._editor.slots.vRangeUpdated.emit([vRange, 'other']);
  };

  /**
   * sync the dom selection from vRange for **this Editor**
   */
  syncVRange = (): void => {
    if (this._vRange) {
      this._applyVRange(this._vRange);
    }
  };

  /**
   * calculate the dom selection from vRange for **this Editor**
   */
  toDomRange = (vRange: VRange): Range | null => {
    const rootElement = this._editor.rootElement;
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
  toVRange = (selection: Selection): VRange | null => {
    const { rootElement, yText } = this._editor;

    return domRangeToVirgoRange(selection, rootElement, yText);
  };

  mergeRanges = (range1: VRange, range2: VRange): VRange => {
    return {
      index: Math.max(range1.index, range2.index),
      length:
        Math.min(range1.index + range1.length, range2.index + range2.length) -
        Math.max(range1.index, range2.index),
    };
  };

  onScrollUpdated = (scrollLeft: number) => {
    this._lastScrollLeft = scrollLeft;
  };

  private _applyVRange = (vRange: VRange): void => {
    if (!this._editor.isActive) {
      return;
    }
    const selectionRoot = findDocumentOrShadowRoot(this._editor);
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

    this._scrollLineIntoViewIfNeeded(newRange);
    this._scrollCursorIntoViewIfNeeded(newRange);

    this._editor.slots.rangeUpdated.emit(newRange);
  };

  private _scrollLineIntoViewIfNeeded = (range: Range) => {
    if (this._editor.shouldLineScrollIntoView) {
      let lineElement: HTMLElement | null = range.endContainer.parentElement;
      while (!(lineElement instanceof VirgoLine)) {
        lineElement = lineElement?.parentElement ?? null;
      }
      lineElement?.scrollIntoView({
        block: 'nearest',
      });
    }
  };

  private _scrollCursorIntoViewIfNeeded = (range: Range) => {
    if (this._editor.shouldCursorScrollIntoView) {
      const root = this._editor.rootElement;

      const rootRect = root.getBoundingClientRect();
      const rangeRect = range.getBoundingClientRect();

      let moveX = 0;
      if (rangeRect.left > rootRect.left) {
        moveX = Math.max(this._lastScrollLeft, rangeRect.left - rootRect.right);
      }

      root.scrollLeft = moveX;
      this._lastScrollLeft = moveX;
    }
  };
}
