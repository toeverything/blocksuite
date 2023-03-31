import { VirgoLine } from '../components/index.js';
import type { VRange } from '../types.js';
import type { VRangeUpdatedProp } from '../types.js';
import type { BaseTextAttributes } from '../utils/index.js';
import {
  calculateTextLength,
  findDocumentOrShadowRoot,
} from '../utils/index.js';
import { toVirgoRange } from '../utils/to-virgo-range.js';
import { VEditor } from '../virgo.js';

export class VirgoRangeService<TextAttributes extends BaseTextAttributes> {
  private readonly _editor: VEditor<TextAttributes>;

  private _vRange: VRange | null = null;

  constructor(editor: VEditor<TextAttributes>) {
    this._editor = editor;
  }

  onVRangeUpdated = ([newVRange, origin]: VRangeUpdatedProp) => {
    this._vRange = newVRange;

    if (origin === 'native') {
      return;
    }

    const fn = () => {
      if (newVRange) {
        // when using input method _vRange will return to the starting point,
        // so we need to re-sync
        this._applyVRange(newVRange);
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
    const lineElements = Array.from(rootElement.querySelectorAll('v-line'));

    // calculate anchorNode and focusNode
    let anchorText: Text | null = null;
    let focusText: Text | null = null;
    let anchorOffset = 0;
    let focusOffset = 0;
    let index = 0;

    for (let i = 0; i < lineElements.length; i++) {
      if (anchorText && focusText) {
        break;
      }

      const texts = VEditor.getTextNodesFromElement(lineElements[i]);
      for (const text of texts) {
        const textLength = calculateTextLength(text);

        if (!anchorText && index + textLength >= vRange.index) {
          anchorText = text;
          anchorOffset = vRange.index - index;
        }
        if (!focusText && index + textLength >= vRange.index + vRange.length) {
          focusText = text;
          focusOffset = vRange.index + vRange.length - index;
        }

        if (anchorText && focusText) {
          break;
        }

        index += textLength;
      }

      // the one because of the line break
      index += 1;
    }

    if (!anchorText || !focusText) {
      return null;
    }

    const range = document.createRange();
    range.setStart(anchorText, anchorOffset);
    range.setEnd(focusText, focusOffset);

    return range;
  };

  private _applyVRange = (vRange: VRange): void => {
    const newRange = this.toDomRange(vRange);

    if (!newRange) {
      return;
    }

    const selectionRoot = findDocumentOrShadowRoot(this._editor);
    const selection = selectionRoot.getSelection();
    if (!selection) {
      return;
    }
    selection.removeAllRanges();
    selection.addRange(newRange);

    this._scrollIntoViewIfNeeded(newRange);

    this._editor.slots.rangeUpdated.emit(newRange);
  };

  private _scrollIntoViewIfNeeded = (range: Range) => {
    if (this._editor.shouldScrollIntoView) {
      let lineElement: HTMLElement | null = range.endContainer.parentElement;
      while (!(lineElement instanceof VirgoLine)) {
        lineElement = lineElement?.parentElement ?? null;
      }
      lineElement?.scrollIntoView({
        block: 'nearest',
      });
    }
  };

  toVRange = (selection: Selection): VRange | null => {
    const { rootElement, yText } = this._editor;

    return toVirgoRange(selection, rootElement, yText);
  };
}
