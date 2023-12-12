import type { TextRangePoint } from '@blocksuite/block-std';
import type { TextSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import {
  type VEditor,
  VIRGO_ROOT_ATTR,
  type VirgoRootElement,
  type VRange,
} from '@blocksuite/virgo';

import type { BlockElement } from '../element/block-element.js';
import type { EditorHost } from '../element/lit-host.js';
import { RangeSynchronizer } from './range-synchronizer.js';

type RangeSnapshot = {
  startContainer: Node;
  endContainer: Node;
  startOffset: number;
  endOffset: number;
};

/**
 * CRUD for Range and TextSelection
 */
export class RangeManager {
  readonly rangeSynchronizer = new RangeSynchronizer(this);

  constructor(public host: EditorHost) {}

  get value() {
    return this._range;
  }

  private _range: Range | null = null;
  private _isRangeReversed: boolean = false;

  clearRange(sync = true) {
    this._range = null;
    this._isRangeReversed = false;
    window.getSelection()?.removeAllRanges();
    if (sync) {
      this.host.selection.clear(['text']);
    }
  }

  renderRange(start: Range, end?: Range | null) {
    const ranges = [start];
    if (end) {
      ranges.push(end);
    }

    const mergedRangeResult = this._mergeRanges(ranges);
    this._range = mergedRangeResult?.range ?? null;
    this._isRangeReversed = mergedRangeResult?.reversed ?? false;

    this._renderRange();
  }

  syncTextSelectionToRange(selection: TextSelection | null) {
    if (!selection) {
      this.clearRange(false);
      return;
    }

    const { from, to } = selection;
    const fromBlock = this.host.view.viewFromPath('block', from.path);
    if (!fromBlock) {
      this.clearRange();
      return;
    }

    const startRange = this.pointToRange(from);
    const endRange = to ? this.pointToRange(to) : null;

    if (!startRange) {
      this.clearRange(false);
      return;
    }
    this.renderRange(startRange, endRange);
  }

  syncRangeToTextSelection(range: Range | null, isRangeReversed: boolean) {
    if (!range) {
      this.clearRange();
      return null;
    }

    const selectionManager = this.host.selection;
    this._range = range;
    this._isRangeReversed = isRangeReversed;

    const { startContainer, endContainer } = range;
    const from = this._nodeToPoint(startContainer);
    const to = range.collapsed ? null : this._nodeToPoint(endContainer);
    if (!from) {
      if (selectionManager.find('text')) {
        selectionManager.clear(['text']);
      }
      return null;
    }

    const selection = selectionManager.getInstance('text', {
      from,
      to,
      isReverse: isRangeReversed,
    });

    selectionManager.setGroup('note', [selection]);
    return selection;
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
        `[${this.host.blockIdAttr}]:not([data-queryable="false"])`
      )
    ).filter(el => range.intersectsNode(el) && match(el));

    if (result.length === 0) {
      return [];
    }

    const rangeStartElement =
      range.startContainer instanceof Element
        ? range.startContainer
        : range.startContainer.parentElement;
    const firstElement = rangeStartElement?.closest(
      `[${this.host.blockIdAttr}]`
    );
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
    const fromBlock = this.host.view.viewFromPath('block', from.path);
    if (!fromBlock) {
      return null;
    }

    const startRange = this.pointToRange(from);
    const endRange = to ? this.pointToRange(to) : null;

    if (!startRange) {
      return null;
    }

    const ranges = [startRange];
    if (endRange) {
      ranges.push(endRange);
    }

    const mergedRangeResult = this._mergeRanges(ranges);
    return mergedRangeResult?.range ?? null;
  }

  pointToRange(point: TextRangePoint): Range | null {
    const result = this._calculateVirgo(point);
    if (!result) {
      return null;
    }
    const [virgoEditor, vRange] = result;

    return virgoEditor.toDomRange(vRange);
  }

  private _calculateVirgo(point: TextRangePoint): [VEditor, VRange] | null {
    const block = this.host.view.viewFromPath('block', point.path);
    if (!block) {
      return null;
    }
    const virgoRoot = block.querySelector<VirgoRootElement>(
      `[${VIRGO_ROOT_ATTR}]`
    );
    assertExists(
      virgoRoot,
      `Cannot find virgo element in block ${point.path.join(' > ')}}`
    );

    const maxLength = virgoRoot.virgoEditor.yText.length;
    const index = point.index >= maxLength ? maxLength : point.index;
    const length =
      index + point.length >= maxLength ? maxLength - index : point.length;

    return [
      virgoRoot.virgoEditor,
      {
        index,
        length,
      },
    ];
  }

  private _nodeToPoint(node: Node) {
    const virgoElement = this._getNearestVirgo(node);
    if (!virgoElement) {
      return null;
    }
    const block = this._getBlock(virgoElement);
    if (!block) {
      return null;
    }
    const vRange = this._range
      ? virgoElement.virgoEditor.toVRange(this._range)
      : null;
    if (!vRange) {
      return null;
    }

    return {
      blockId: block.model.id,
      path: block.path,
      index: vRange.index,
      length: vRange.length,
    };
  }

  private _snapshotToRange(snapshot: RangeSnapshot): Range {
    const range = document.createRange();
    range.setStart(snapshot.startContainer, snapshot.startOffset);
    range.setEnd(snapshot.endContainer, snapshot.endOffset);
    return range;
  }

  private _mergeRanges(
    ranges: RangeSnapshot[]
  ): { range: Range; reversed: boolean } | null {
    if (ranges.length === 0) {
      return null;
    }
    if (ranges.length === 1) {
      const [current] = ranges;
      const range = document.createRange();
      range.setStart(current.startContainer, current.startOffset);
      range.setEnd(current.endContainer, current.endOffset);
      return { range, reversed: false };
    }

    const [leftRangeSnapshot, rightRangeSnapshot] = ranges;
    let leftRange = this._snapshotToRange(leftRangeSnapshot);
    let rightRange = this._snapshotToRange(rightRangeSnapshot);

    const restRanges = ranges.slice(2);
    const result = leftRange.compareBoundaryPoints(
      Range.END_TO_START,
      rightRange
    );
    if (result > 0) {
      [leftRange, rightRange] = [rightRange, leftRange];
    }

    while (restRanges.length > 0) {
      const snapshot = restRanges.pop();
      if (!snapshot) {
        break;
      }
      const range = this._snapshotToRange(snapshot);
      const left = range.compareBoundaryPoints(Range.START_TO_END, leftRange);
      const right = range.compareBoundaryPoints(Range.END_TO_START, rightRange);
      if (left < 0) {
        leftRange = range;
      }
      if (right > 0) {
        rightRange = range;
      }
    }

    const range = document.createRange();
    range.setStart(leftRange.startContainer, leftRange.startOffset);
    range.setEnd(rightRange.endContainer, rightRange.endOffset);

    leftRange.detach();
    rightRange.detach();

    return { range, reversed: result > 0 };
  }

  private _renderRange() {
    const selection = document.getSelection();
    if (!selection || !this._range) {
      this.clearRange();
      return;
    }

    selection.removeAllRanges();

    if (this._isRangeReversed) {
      const nextRange = document.createRange();
      nextRange.setStart(this._range.endContainer, this._range.endOffset);
      selection.addRange(nextRange);
      selection.extend(this._range.startContainer, this._range.startOffset);
    } else {
      selection.addRange(this._range);
    }
  }

  private _getNearestVirgo(node: Node) {
    let element: Element | null;
    if (node instanceof Element) {
      element = node;
    } else {
      element = node.parentElement;
    }
    if (!element) {
      return;
    }

    return element.closest(`[${VIRGO_ROOT_ATTR}]`) as VirgoRootElement;
  }

  private _getBlock(element: HTMLElement) {
    return element.closest(`[${this.host.blockIdAttr}]`) as BlockElement;
  }
}
