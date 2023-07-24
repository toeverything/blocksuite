import { BaseSelection } from '../base.js';

export type TextRangePoint = {
  blockId: string;
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
    super(from.blockId);
    this.from = from;
    this.to = to;
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
        a.blockId === b.blockId && a.index === b.index && a.length === b.length
      );
    }

    return a === b;
  }

  override equals(other: BaseSelection): boolean {
    if (other instanceof TextSelection) {
      return (
        other.blockId === this.blockId &&
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
}

declare global {
  interface BlockSuiteSelection {
    text: typeof TextSelection;
  }
}
