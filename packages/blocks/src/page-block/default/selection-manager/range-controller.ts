import type { TextRangePoint } from '@blocksuite/block-std';
import type { TextSelection } from '@blocksuite/block-std';
import { BLOCK_ID_ATTR } from '@blocksuite/global/config';
import { assertExists } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { VirgoRootElement } from '@blocksuite/virgo';

type RangeSnapshot = {
  startContainer: Node;
  endContainer: Node;
  startOffset: number;
  endOffset: number;
};

export class RangeController {
  private _reusedRange: Range | null = null;

  constructor(public root: BlockSuiteRoot) {}

  get value() {
    return this._range;
  }

  private get _range() {
    if (!this._reusedRange) {
      this._reusedRange = document.createRange();
    }
    return this._reusedRange;
  }

  render(start: Range, end?: Range | null) {
    const ranges = [start];
    if (end) {
      ranges.push(end);
    }

    this._mergeRanges(ranges);
    this._renderRange();
  }

  syncRange(selection: TextSelection | null) {
    if (!selection) {
      this._reusedRange = null;
      window.getSelection()?.removeAllRanges();
      return;
    }

    const { from, to } = selection;
    const fromBlock = this.root.blockViewMap.get(from.path);
    if (!fromBlock) {
      return;
    }

    const startRange = this._pointToRange(from);
    const endRange = to ? this._pointToRange(to) : null;

    if (!startRange) {
      return;
    }
    this.render(startRange, endRange);
  }

  writeRange(range: Range | null) {
    const selectionManager = this.root.selectionManager;
    const hasTextSelection =
      selectionManager.value.filter(sel => sel.is('text')).length > 0;
    if (range !== undefined) {
      this._reusedRange = range;
    }

    if (!this._range) {
      if (hasTextSelection) {
        selectionManager.clear();
      }
      return null;
    }

    const { startContainer, endContainer } = this._range;
    const from = this._nodeToPoint(startContainer);
    const to = range?.collapsed ? null : this._nodeToPoint(endContainer);

    if (!from) {
      if (hasTextSelection) {
        selectionManager.clear();
      }
      return null;
    }

    const selection = selectionManager.getInstance('text', {
      from,
      to,
    });

    selectionManager.set([selection]);
    return selection;
  }

  private _pointToRange(point: TextRangePoint): Range | null {
    const fromBlock = this.root.blockViewMap.get(point.path);
    assertExists(fromBlock, `Cannot find block ${point.path.join(' > ')}`);
    const startVirgoElement =
      fromBlock.querySelector<VirgoRootElement>('[data-virgo-root]');
    assertExists(
      startVirgoElement,
      `Cannot find virgo element in block ${point.path.join(' > ')}}`
    );

    startVirgoElement.virgoEditor.setVRange({
      index: point.index,
      length: point.length,
    });

    return startVirgoElement.virgoEditor.toDomRange({
      index: point.index,
      length: point.length,
    });
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
    const vRange = virgoElement.virgoEditor.toVRange(this._range);
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

  private _mergeRanges(ranges: RangeSnapshot[]) {
    if (ranges.length === 0) {
      return;
    }
    if (ranges.length === 1) {
      const [current] = ranges;
      this._range.setStart(current.startContainer, current.startOffset);
      this._range.setEnd(current.endContainer, current.endOffset);
      return;
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

    this._range.setStart(leftRange.startContainer, leftRange.startOffset);
    this._range.setEnd(rightRange.endContainer, rightRange.endOffset);

    leftRange.detach();
    rightRange.detach();
  }

  private _renderRange() {
    const selection = document.getSelection();
    if (!selection || !this._range) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(this._range);
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

    return element.closest('[data-virgo-root]') as VirgoRootElement;
  }

  private _getBlock(element: HTMLElement) {
    return element.closest(`[${BLOCK_ID_ATTR}]`) as BlockElement;
  }
}
