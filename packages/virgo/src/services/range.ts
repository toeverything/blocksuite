import type { VRange } from '../types.js';
import type { VRangeUpdatedProp } from '../types.js';
import type { BaseTextAttributes } from '../utils/base-attributes.js';
import { findDocumentOrShadowRoot } from '../utils/query.js';
import {
  domRangeToVirgoRange,
  virgoRangeToDomRange,
} from '../utils/range-conversion.js';
import { isMaybeVRangeEqual } from '../utils/v-range.js';
import type { VEditor } from '../virgo.js';

export class VirgoRangeService<TextAttributes extends BaseTextAttributes> {
  private _vRange: VRange | null = null;

  constructor(public readonly editor: VEditor<TextAttributes>) {}

  get vRangeProvider() {
    return this.editor.vRangeProvider;
  }

  onVRangeUpdated = ([newVRange, sync]: VRangeUpdatedProp) => {
    const eq = isMaybeVRangeEqual(this._vRange, newVRange);
    if (eq) {
      return;
    }

    this._vRange = newVRange;

    // try to trigger update because the `selected` state of the virgo element may change
    if (this.editor.mounted) {
      this.editor.requestUpdate(false);
    }

    if (this.vRangeProvider) {
      this.vRangeProvider.setVRange(newVRange);
      return;
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

  getVRange = (): VRange | null => {
    if (this.vRangeProvider) {
      return this.vRangeProvider.getVRange();
    }

    return this._vRange;
  };

  isVRangeValid = (vRange: VRange | null): boolean => {
    return !(
      vRange &&
      (vRange.index < 0 ||
        vRange.index + vRange.length > this.editor.yText.length)
    );
  };

  /**
   * the vRange is synced to the native selection asynchronically
   * if sync is true, the native selection will be synced immediately
   */
  setVRange = (vRange: VRange | null, sync = true): void => {
    if (!this.isVRangeValid(vRange)) {
      throw new Error('invalid vRange');
    }

    this.editor.slots.vRangeUpdated.emit([vRange, sync]);
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
