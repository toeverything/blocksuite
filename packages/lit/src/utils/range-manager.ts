import type { TextRangePoint } from '@blocksuite/block-std';
import type { TextSelection } from '@blocksuite/block-std';
import { assertExists } from '@blocksuite/global/utils';
import type { BaseBlockModel } from '@blocksuite/store';
import type { VirgoRootElement } from '@blocksuite/virgo';

import type { BlockElement } from '../element/block-element.js';
import type { BlockSuiteRoot } from '../element/lit-root.js';
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
  private _reusedRange: Range | null = null;

  constructor(public root: BlockSuiteRoot) {
    new RangeSynchronizer(root);
  }

  get value() {
    return this._range;
  }

  private get _range() {
    if (!this._reusedRange) {
      this._reusedRange = document.createRange();
    }
    return this._reusedRange;
  }

  renderRange(start: Range, end?: Range | null) {
    const ranges = [start];
    if (end) {
      ranges.push(end);
    }

    const range = this._mergeRanges(ranges);
    if (range) {
      this._reusedRange = range;
      this._renderRange();
    }
  }

  syncTextSelectionToRange(selection: TextSelection | null) {
    if (!selection) {
      this._reusedRange = null;
      window.getSelection()?.removeAllRanges();
      return;
    }

    const { from, to } = selection;
    const fromBlock = this.root.viewStore.viewFromPath('block', from.path);
    if (!fromBlock) {
      return;
    }

    const startRange = this.pointToRange(from);
    const endRange = to ? this.pointToRange(to) : null;

    if (!startRange) {
      return;
    }
    this.renderRange(startRange, endRange);
  }

  syncRangeToTextSelection(range: Range) {
    const selectionManager = this.root.selectionManager;
    this._reusedRange = range;

    const { startContainer, endContainer } = this._range;
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
    });

    selectionManager.setGroup('note', [selection]);
    return selection;
  }

  findBlockElementsByRange = (range: Range): BlockElement[] => {
    const start = range.startContainer;
    const end = range.endContainer;
    const ancestor = range.commonAncestorContainer;
    const getBlockView = (node: Node) =>
      this.root.viewStore.getNodeView(node)?.view as BlockElement;

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
  };

  getSelectedBlocksIdByRange(range: Range): BaseBlockModel['id'][] {
    return this.getSelectedBlockElementsByRange(range).map(el => el.model.id);
  }

  getSelectedBlockElementsByRange(range: Range): BlockElement[] {
    return Array.from<BlockElement>(
      this.root.querySelectorAll(`[${this.root.blockIdAttr}]`)
    ).filter(el => range.intersectsNode(el));
  }

  textSelectionToRange(selection: TextSelection): Range | null {
    const { from, to } = selection;
    const fromBlock = this.root.viewStore.viewFromPath('block', from.path);
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

    return this._mergeRanges(ranges);
  }

  pointToRange(point: TextRangePoint): Range | null {
    const fromBlock = this.root.viewStore.viewFromPath('block', point.path);
    if (!fromBlock) {
      return null;
    }
    const startVirgoElement =
      fromBlock.querySelector<VirgoRootElement>('[data-virgo-root]');
    assertExists(
      startVirgoElement,
      `Cannot find virgo element in block ${point.path.join(' > ')}}`
    );

    const maxLength = startVirgoElement.virgoEditor.yText.length;
    const index = point.index >= maxLength ? maxLength : point.index;
    const length =
      index + point.length >= maxLength ? maxLength - index : point.length;

    startVirgoElement.virgoEditor.setVRange(
      {
        index,
        length,
      },
      false
    );

    return startVirgoElement.virgoEditor.toDomRange({
      index,
      length,
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
      return null;
    }
    if (ranges.length === 1) {
      const [current] = ranges;
      const range = document.createRange();
      range.setStart(current.startContainer, current.startOffset);
      range.setEnd(current.endContainer, current.endOffset);
      return range;
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

    return range;
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
    return element.closest(`[${this.root.blockIdAttr}]`) as BlockElement;
  }
}
