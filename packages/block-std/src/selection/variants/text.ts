import z from 'zod';

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
  isReverse?: boolean;
};

const TextSelectionSchema = z.object({
  from: z.object({
    path: z.array(z.string()),
    index: z.number(),
    length: z.number(),
  }),
  to: z
    .object({
      path: z.array(z.string()),
      index: z.number(),
      length: z.number(),
    })
    .nullable(),
  isReverse: z.boolean().nullable(),
});

export class TextSelection extends BaseSelection {
  static override type = 'text';
  static override group = 'note';

  from: TextRangePoint;

  to: TextRangePoint | null;

  isReverse: boolean;

  constructor({ from, to, isReverse }: TextSelectionProps) {
    super({
      path: from.path,
    });
    this.from = from;

    this.to = this._equalPoint(from, to) ? null : to;

    this.isReverse = !!isReverse;
  }

  get start(): TextRangePoint {
    return this.isReverse ? this.to ?? this.from : this.from;
  }

  get end(): TextRangePoint {
    return this.isReverse ? this.from : this.to ?? this.from;
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
      isReverse: this.isReverse,
    };
  }

  static override fromJSON(json: Record<string, unknown>): TextSelection {
    TextSelectionSchema.parse(json);
    return new TextSelection({
      from: json.from as TextRangePoint,
      to: json.to as TextRangePoint | null,
      isReverse: !!json.isReverse,
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
  namespace BlockSuite {
    interface Selection {
      text: typeof TextSelection;
    }
  }
}
