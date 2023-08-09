import { PathFinder } from '../../utils/path-finder.js';
import { BaseSelection } from '../base.js';

export type TextRangePoint = {
  path: string[];
  index: number;
  length: number;
};

export type TextSelectionProps = {
  from: TextRangePoint;
  to: TextRangePoint | null;
};

export class TextSelection extends BaseSelection {
  static override type = 'text';

  from: TextRangePoint;

  to: TextRangePoint | null;

  constructor({ from, to }: TextSelectionProps) {
    super({
      path: from.path,
    });
    this.from = from;

    this.to = this._equalPoint(from, to) ? null : to;
  }

  empty(): boolean {
    return !!this.to;
  }

  private _equalPoint(
    a: TextRangePoint | null,
    b: TextRangePoint | null
  ): boolean {
    if (a && b) {
      return (
        PathFinder.equals(a.path, b.path) &&
        a.index === b.index &&
        a.length === b.length
      );
    }

    return a === b;
  }

  override equals(other: BaseSelection): boolean {
    if (other instanceof TextSelection) {
      return (
        PathFinder.equals(this.path, other.path) &&
        this._equalPoint(other.from, this.from) &&
        this._equalPoint(other.to, this.to)
      );
    }
    return false;
  }
  override toJSON(): Record<string, unknown> {
    return {
      type: 'text',
      from: this.from,
      to: this.to,
    };
  }

  static override fromJSON(json: Record<string, unknown>): TextSelection {
    return new TextSelection({
      from: json.from as TextRangePoint,
      to: json.to as TextRangePoint | null,
    });
  }

  isCollapsed(): boolean {
    return this.to === null && this.from.length === 0;
  }

  isInSameBlock(): boolean {
    return this.to === null || PathFinder.equals(this.from.path, this.to.path);
  }
}

declare global {
  interface BlockSuiteSelection {
    text: typeof TextSelection;
  }
}
