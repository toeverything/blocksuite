import type { TextRangePoint, TextSelection } from '@blocksuite/block-std';
import type { BaseSelection } from '@blocksuite/block-std';
import { PathMap } from '@blocksuite/block-std';
import type { BlockElement } from '@blocksuite/lit';
import type { Text } from '@blocksuite/store';
import { getTextNodesFromElement } from '@blocksuite/virgo';

import type { DefaultPageBlockComponent } from '../default-page-block.js';

export class Synchronizer {
  private _prevSelection: BaseSelection | null = null;
  private get _selection() {
    return this.host.root.selectionManager;
  }

  private get _isNativeSelection() {
    return Boolean(this.host.gesture?.isNativeSelection);
  }

  private get _currentSelection() {
    return this._selection.value;
  }

  constructor(public host: DefaultPageBlockComponent) {
    this.host.disposables.add(
      this._selection.slots.changed.on(selections => {
        if (this._isNativeSelection) {
          return;
        }
        // wait for lit updated
        requestAnimationFrame(() => {
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
          this.host.rangeController.syncRange(text);
        });
      })
    );

    this.host.handleEvent('selectionChange', () => {
      const selection = window.getSelection();
      if (!selection) {
        return;
      }
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      this._prevSelection = this.host.rangeController.writeRange(range) ?? null;
    });

    this.host.handleEvent('beforeInput', ctx => {
      const event = ctx.get('defaultState').event as InputEvent;
      if (this.host.page.readonly) return;

      const current = this._currentSelection.at(0);
      if (!current) return;

      if (current.is('text')) {
        this._beforeTextInput(current, event.isComposing);
        return;
      }
    });
  }

  private _findBlockElement(range: Range): BlockElement[] {
    const start = range.startContainer;
    const end = range.endContainer;
    const ancestor = range.commonAncestorContainer;
    const getBlockView = this.host.root.blockStore.config.getBlockViewByNode;
    if (ancestor.nodeType === Node.TEXT_NODE) {
      const block = getBlockView(ancestor);
      if (!block) return [];
      return [block];
    }
    const nodes = new Set<Node>();

    let startRecorded = false;
    const dfsDOMSearch = (current: Node | null, ancestor: Node) => {
      if (!current) {
        return;
      }
      if (current === ancestor) {
        return;
      }
      if (current === end) {
        nodes.add(current);
        startRecorded = false;
        return;
      }
      if (current === start) {
        startRecorded = true;
      }
      if (startRecorded) {
        if (
          current.nodeType === Node.TEXT_NODE ||
          current.nodeType === Node.ELEMENT_NODE
        ) {
          nodes.add(current);
        }
      }
      dfsDOMSearch(current.firstChild, ancestor);
      dfsDOMSearch(current.nextSibling, ancestor);
    };
    dfsDOMSearch(ancestor.firstChild, ancestor);

    const blocks = new Set<BlockElement>();
    nodes.forEach(node => {
      const blockView = getBlockView(node);
      if (!blockView) {
        return;
      }
      if (blocks.has(blockView)) {
        return;
      }
      blocks.add(blockView);
    });
    return Array.from(blocks);
  }

  private _beforeTextInput(selection: TextSelection, composing: boolean) {
    const { from, to } = selection;
    if (!to || PathMap.equals(from.path, to.path)) return;

    const range = this.host.rangeController.value;
    if (!range) return;

    const blocks = this._findBlockElement(range);
    const start = blocks.at(0);
    const end = blocks.at(-1);
    if (!start || !end) return;
    const startText = start.model.text;
    const endText = end.model.text;
    if (!startText || !endText) return;

    const endIsSelectedAll = to.length === endText.length;

    this.host.page.transact(() => {
      if (endIsSelectedAll && composing) {
        this._shamefullyResetIMERangeBeforeInput(startText, start, from);
      }
      if (!endIsSelectedAll) {
        endText.delete(0, to.length);
        startText.join(endText);
      }
      blocks.slice(1).forEach(block => {
        this.host.page.deleteBlock(block.model);
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
