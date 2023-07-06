export class RangeController {
  private _pending: Range[] = [];
  private _timer = 0;

  add(range: Range) {
    this._pending.push(range);
  }

  start() {
    this._timer = window.setInterval(() => {
      if (this._pending.length === 0) {
        return;
      }

      const range = this._mergeRanges(this._pending);
      this._pending = [];

      if (!range) {
        return;
      }

      this._renderRange(range);
    }, 200);
  }

  stop() {
    window.clearInterval(this._timer);
  }

  private _mergeRanges(ranges: Range[]): Range | null {
    if (ranges.length === 0) {
      return null;
    }
    if (ranges.length === 1) {
      return ranges[0];
    }

    let [leftRange, rightRange] = ranges;

    const restRanges = ranges.slice(2);
    const result = leftRange.compareBoundaryPoints(
      Range.END_TO_START,
      rightRange
    );
    if (result > 0) {
      [leftRange, rightRange] = [rightRange, leftRange];
    }

    while (restRanges.length > 0) {
      const range = restRanges.pop();
      if (!range) {
        break;
      }
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
