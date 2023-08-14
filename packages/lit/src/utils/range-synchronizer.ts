import type { TextRangePoint, TextSelection } from '@blocksuite/block-std';
import type { BaseSelection } from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import { assertExists, type Text } from '@blocksuite/store';
import { getTextNodesFromElement } from '@blocksuite/virgo';

import type { BlockElement } from '../element/block-element.js';
import type { BlockSuiteRoot } from '../element/lit-root.js';

/**
 * Two-way binding between native range and text selection
 */
export class RangeSynchronizer {
  private _prevSelection: BaseSelection | null = null;
  private get _selectionManager() {
    return this.root.selectionManager;
  }

  private get _currentSelection() {
    return this._selectionManager.value;
  }

  private get _rangeManager() {
    assertExists(this.root.rangeManager);
    return this.root.rangeManager;
  }

  constructor(public root: BlockSuiteRoot) {
    this.root.disposables.add(
      this._selectionManager.slots.changed.on(this._onSelectionModelChanged)
    );

    this.root.disposables.add(
      this.root.uiEventDispatcher.add('selectionChange', () => {
        const selection = window.getSelection();
        if (!selection) {
          this._selectionManager.clear();
          return;
        }
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        if (range && range.intersectsNode(this.root)) {
          this._prevSelection =
            this._rangeManager.syncRangeToTextSelection(range);
        } else {
          this._prevSelection = null;
          this._selectionManager.clear(['text']);
        }
      })
    );

    this.root.disposables.add(
      this.root.uiEventDispatcher.add('beforeInput', ctx => {
        const event = ctx.get('defaultState').event as InputEvent;
        if (this.root.page.readonly) return;

        const current = this._currentSelection.at(0);
        if (!current) return;

        if (current.is('text')) {
          this._beforeTextInput(current, event.isComposing);
          return;
        }
      })
    );
  }

  private _onSelectionModelChanged = (selections: BaseSelection[]) => {
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
    this.root.disposables.add(() => {
      cancelAnimationFrame(rafId);
    });
  };

  private _beforeTextInput(selection: TextSelection, composing: boolean) {
    const { from, to } = selection;
    if (!to || PathFinder.equals(from.path, to.path)) return;

    const range = this._rangeManager.value;
    if (!range) return;

    const blocks = this._rangeManager.getSelectedBlockElementsByRange(range, {
      match: element => element.model.role === 'content',
      mode: 'flat',
    });

    const start = blocks.at(0);
    const end = blocks.at(-1);
    if (!start || !end) return;
    const startText = start.model.text;
    const endText = end.model.text;
    if (!startText || !endText) return;

    const endIsSelectedAll = to.length === endText.length;

    this.root.page.transact(() => {
      if (endIsSelectedAll && composing) {
        this._shamefullyResetIMERangeBeforeInput(startText, start, from);
      }
      if (!endIsSelectedAll) {
        endText.delete(0, to.length);
        startText.join(endText);
      }
      blocks.slice(1).forEach(block => {
        this.root.page.deleteBlock(block.model);
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
