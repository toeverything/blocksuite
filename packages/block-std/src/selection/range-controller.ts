type RangeSnapshot = {
  startContainer: Node;
  endContainer: Node;
  startOffset: number;
  endOffset: number;
};

const observeOptions = {
  childList: true,
  characterData: true,
  characterDataOldValue: true,
  attributes: true,
  attributeOldValue: true,
  subtree: true,
};

export class RangeController {
  private _pending: RangeSnapshot[] = [];
  private _timer = 0;
  private _reusedRange: Range | null = null;
  private _observer: MutationObserver;

  constructor(public root: HTMLElement) {
    this._observer = new MutationObserver(() => {
      const sel = document.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (this._reusedRange && range !== this._reusedRange) {
        this._renderRange();
      }
    });
  }

  private get _range() {
    if (!this._reusedRange) {
      this._reusedRange = document.createRange();
    }
    return this._reusedRange;
  }

  add(range: Range) {
    this._pending.push({
      startContainer: range.startContainer,
      endContainer: range.endContainer,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
    });
  }

  render(start: Range, end?: Range) {
    this._pending = [start];
    if (end) {
      this._pending.push(end);
    }

    this._mergeRanges(this._pending);
    this._renderRange();
  }

  start() {
    this._observer.observe(this.root, observeOptions);
    // this._timer = window.setInterval(() => {
    //   if (this._pending.length === 0) {
    //     return;
    //   }
    //
    //   try {
    //     const range = this._mergeRanges(this._pending);
    //     this._pending = [];
    //
    //     if (!range) {
    //       return;
    //     }
    //
    //     this._renderRange(range);
    //   } catch {
    //     // skip
    //   }
    // }, 50);
  }

  stop() {
    this._observer.disconnect();
    // window.clearInterval(this._timer);
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
}
