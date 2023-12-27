import type {
  BaseSelection,
  TextRangePoint,
  TextSelection,
} from '@blocksuite/block-std';
import { PathFinder } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import { getTextNodesFromElement } from '@blocksuite/inline';
import { type Text } from '@blocksuite/store';

import type { BlockElement } from '../element/block-element.js';
import type { RangeManager } from './range-manager.js';

export interface RangeSyncFilter {
  rangeToTextSelection?: (range: Range | null) => boolean;
  textSelectionToRange?: (selection: TextSelection | null) => boolean;
}

/**
 * Two-way binding between native range and text selection
 */
export class RangeSynchronizer {
  private _prevSelection: BaseSelection | null = null;

  private _filter: RangeSyncFilter = {};
  get filter() {
    return this._filter;
  }
  setFilter(filter: RangeSyncFilter) {
    this._filter = filter;
  }

  private get _selectionManager() {
    return this.host.selection;
  }

  private get _rangeManager() {
    assertExists(this.host.rangeManager);
    return this.host.rangeManager;
  }

  private _isComposing = false;

  get host() {
    return this.manager.host;
  }

  constructor(public manager: RangeManager) {
    this.host.disposables.add(
      this._selectionManager.slots.changed.on(this._onSelectionModelChanged)
    );

    this.host.event.add('compositionStart', () => {
      this._isComposing = true;
    });
    this.host.event.add('compositionEnd', () => {
      this._isComposing = false;
    });

    this.host.disposables.add(
      this.host.event.add('selectionChange', () => {
        const selection = window.getSelection();
        if (!selection) {
          this._selectionManager.clear();
          return;
        }
        const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        const isRangeReversed =
          !!selection.anchorNode &&
          !!selection.focusNode &&
          (selection.anchorNode === selection.focusNode
            ? selection.anchorOffset > selection.focusOffset
            : selection.anchorNode.compareDocumentPosition(
                selection.focusNode
              ) === Node.DOCUMENT_POSITION_PRECEDING);

        if (
          this.filter.rangeToTextSelection &&
          !this.filter.rangeToTextSelection(range)
        ) {
          return;
        }

        if (this._isComposing) {
          return;
        }

        if (range === null || range.intersectsNode(this.host)) {
          this._prevSelection = this._rangeManager.syncRangeToTextSelection(
            range,
            isRangeReversed
          );
        } else {
          this._prevSelection = null;
          this._selectionManager.clear(['text']);
        }
      })
    );

    this.host.disposables.add(
      this.host.event.add('beforeInput', ctx => {
        const event = ctx.get('defaultState').event as InputEvent;
        if (this.host.page.readonly) return;

        const current = this._selectionManager.find('text');
        if (!current) return;

        this._beforeTextInput(current, event);
        return;
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

      if (
        this.filter.textSelectionToRange &&
        !this.filter.textSelectionToRange(text)
      ) {
        return;
      }

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
    this.host.disposables.add(() => {
      cancelAnimationFrame(rafId);
    });
  };

  private _beforeTextInput(selection: TextSelection, event: InputEvent) {
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

    this.host.page.transact(() => {
      if (endIsSelectedAll && event.isComposing) {
        this._shamefullyResetIMERangeBeforeInput(startText, start, from);
      }

      startText.delete(from.index, from.length);
      startText.insert(event.data ?? '', from.index);
      if (!endIsSelectedAll) {
        endText.delete(0, to.length);
        startText.join(endText);
      }

      blocks
        .slice(1)
        // delete from lowest to highest
        .reverse()
        .forEach(block => {
          const parent = this.host.page.getParent(block.model);
          assertExists(parent);
          this.host.page.deleteBlock(block.model, {
            bringChildrenTo: parent,
          });
        });
    });

    const newSelection = this._selectionManager.create('text', {
      from: {
        path: from.path,
        index: from.index + (event.data?.length ?? 0),
        length: 0,
      },
      to: null,
    });
    this._selectionManager.set([newSelection]);

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
