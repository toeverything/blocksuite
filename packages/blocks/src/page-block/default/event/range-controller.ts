import type { TextRangePoint } from '@blocksuite/block-std';
import type { TextSelection } from '@blocksuite/block-std';
import { BLOCK_ID_ATTR } from '@blocksuite/global/config';
import { assertExists, matchFlavours } from '@blocksuite/global/utils';
import type { BlockElement } from '@blocksuite/lit';
import type { BlockSuiteRoot } from '@blocksuite/lit';
import type { BaseBlockModel } from '@blocksuite/store';
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
    let hasTextSelection = false;
    const noneTextSelection = selectionManager.value.filter(sel => {
      if (sel.is('text')) hasTextSelection = true;
      return !sel.is('text');
    });
    this._reusedRange = range;

    const { startContainer, endContainer } = this._range;
    const from = this._nodeToPoint(startContainer);
    const to = range?.collapsed ? null : this._nodeToPoint(endContainer);

    if (!from) {
      if (hasTextSelection) {
        selectionManager.clear(['text']);
      }
      return null;
    }

    if (
      matchFlavours(
        this.root.page.getBlockById(from.blockId) as BaseBlockModel,
        ['affine:page']
      )
    ) {
      return null;
    }

    const selection = selectionManager.getInstance('text', {
      from,
      to,
    });

    selectionManager.set([...noneTextSelection, selection]);
    return selection;
  }

  findBlockElementsByRange = (range: Range): BlockElement[] => {
    const start = range.startContainer;
    const end = range.endContainer;
    const ancestor = range.commonAncestorContainer;
    const getBlockView = this.root.blockStore.config.getBlockViewByNode;
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

  getSelectedBlocks(range: Range): BaseBlockModel['id'][] {
    const blocksId = Array.from(
      range.cloneContents().querySelectorAll<BlockElement>(`[${BLOCK_ID_ATTR}]`)
    ).map(block => {
      const id = block.getAttribute(BLOCK_ID_ATTR);
      assertExists(id, 'Cannot find block id');
      return id;
    });

    return blocksId;
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
