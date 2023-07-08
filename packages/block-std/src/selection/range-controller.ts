type RangeSnapshot = {
  startContainer: Node;
  endContainer: Node;
  startOffset: number;
  endOffset: number;
};
export class RangeController {
  private _pending: RangeSnapshot[] = [];
  private _timer = 0;

  add(range: Range) {
    this._pending.push({
      startContainer: range.startContainer,
      endContainer: range.endContainer,
      startOffset: range.startOffset,
      endOffset: range.endOffset,
    });
  }

  start() {
    this._timer = window.setInterval(() => {
      if (this._pending.length === 0) {
        return;
      }

      try {
        const range = this._mergeRanges(this._pending);
        this._pending = [];

        if (!range) {
          return;
        }

        this._renderRange(range);
      } catch {
        // skip
      }
    }, 200);
  }

  stop() {
    window.clearInterval(this._timer);
  }

  private _snapshotToRange(snapshot: RangeSnapshot): Range {
    const range = new Range();
    range.setStart(snapshot.startContainer, snapshot.startOffset);
    range.setEnd(snapshot.endContainer, snapshot.endOffset);
    return range;
  }

  private _mergeRanges(ranges: RangeSnapshot[]): Range | null {
    if (ranges.length === 0) {
      return null;
    }
    if (ranges.length === 1) {
      const [current] = ranges;
      return this._snapshotToRange(current);
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

    const range = new Range();
    range.setStart(leftRange.startContainer, leftRange.startOffset);
    range.setEnd(rightRange.endContainer, rightRange.endOffset);

    return range;
  }

  private _renderRange(range: Range) {
    const selection = document.getSelection();
    if (!selection) {
      return;
    }

    selection.removeAllRanges();
    selection.addRange(range);
  }
}
