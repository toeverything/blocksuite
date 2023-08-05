import type { TextRangePoint, TextSelection } from '@blocksuite/block-std';
import type { BaseSelection } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';
import { assertExists, type Text } from '@blocksuite/store';
import { getTextNodesFromElement } from '@blocksuite/virgo';

import type { PageBlockComponent } from '../types.js';

/**
 * Two-way binding between native range and text selection
 */
export class RangeSynchronizer {
  private _prevSelection: BaseSelection | null = null;
  private get _selection() {
    return this.pageElement.root.selectionManager;
  }

  private get _isNativeSelection() {
    return Boolean(this.pageElement.gesture?.isNativeSelection);
  }

  private get _currentSelection() {
    return this._selection.value;
  }

  private get _rangeManager() {
    assertExists(this.pageElement.rangeManager);
    return this.pageElement.rangeManager;
  }

  constructor(public pageElement: PageBlockComponent) {
    this.pageElement.disposables.add(
      this._selection.slots.changed.on(selections => {
        if (this._isNativeSelection) {
          return;
        }
        // wait for lit updated
        const rafId = requestAnimationFrame(() => {
          const text =
            selections.find((selection): selection is TextSelection =>
              selection.is('text')
            ) ?? null;
          const eq =
            text && this._prevSelection
              ? text.equals(this._prevSelection)
              : text === this._prevSelection;
          if (eq) {
            return;
          }

          this._prevSelection = text;
          this._rangeManager.syncTextSelectionToRange(text);
        });
        this.pageElement.disposables.add(() => {
          cancelAnimationFrame(rafId);
        });
      })
    );

    this.pageElement.handleEvent('selectionChange', () => {
      const selection = window.getSelection();
      if (!selection) {
        return;
      }
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      this._prevSelection =
        this._rangeManager.writeRangeByTextSelection(range) ?? null;
    });

    this.pageElement.handleEvent('beforeInput', ctx => {
      const event = ctx.get('defaultState').event as InputEvent;
      if (this.pageElement.page.readonly) return;

      const current = this._currentSelection.at(0);
      if (!current) return;

      if (current.is('text')) {
        this._beforeTextInput(current, event.isComposing);
        return;
      }
    });
  }

  private _beforeTextInput(selection: TextSelection, composing: boolean) {
    const { from, to } = selection;
    if (!to || PathFinder.equals(from.path, to.path)) return;

    const range = this._rangeManager.value;
    if (!range) return;

    const blocks = this._rangeManager.findBlockElementsByRange(range);
    const start = blocks.at(0);
    const end = blocks.at(-1);
    if (!start || !end) return;
    const startText = start.model.text;
    const endText = end.model.text;
    if (!startText || !endText) return;

    const endIsSelectedAll = to.length === endText.length;

    this.pageElement.page.transact(() => {
      if (endIsSelectedAll && composing) {
        this._shamefullyResetIMERangeBeforeInput(startText, start, from);
      }
      if (!endIsSelectedAll) {
        endText.delete(0, to.length);
        startText.join(endText);
      }
      blocks.slice(1).forEach(block => {
        this.pageElement.page.deleteBlock(block.model);
      });
    });

    return;
  }

  // This is a workaround to fix:
  // 1. select texts cross blocks
  // 2. last block should be all selected
  // 3. input text with IME
  private _shamefullyResetIMERangeBeforeInput(
    startText: Text,
    startElement: BlockElement,
    from: TextRangePoint
  ) {
    startText.delete(from.index, startText.length - from.index);
    const texts = getTextNodesFromElement(startElement);
    const last = texts.at(-1);
    const selection = document.getSelection();
    if (last && selection) {
      const _range = document.createRange();
      _range.selectNode(last);
      _range.setStart(last, last.length);
      _range.collapse();
      selection.removeAllRanges();
      selection.addRange(_range);
    }
  }
}
