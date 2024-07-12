import z from 'zod';

import { BaseSelection } from '../base.js';

export type TextRangePoint = {
  blockId: string;
  index: number;
  length: number;
};

export type TextSelectionProps = {
  from: TextRangePoint;
  reverse?: boolean;
  to: TextRangePoint | null;
};

const TextSelectionSchema = z.object({
  from: z.object({
    blockId: z.string(),
    index: z.number(),
    length: z.number(),
  }),
  // since `reverse` may not exist in remote selection.
  reverse: z.boolean().optional(),
  // The `optional()` is for backward compatibility,
  to: z
    .object({
      blockId: z.string(),
      index: z.number(),
      length: z.number(),
    })
    .nullable(),
});

export class TextSelection extends BaseSelection {
  static override group = 'note';

  static override type = 'text';

  from: TextRangePoint;

  reverse: boolean;

  to: TextRangePoint | null;

  constructor({ from, reverse, to }: TextSelectionProps) {
    super({
      blockId: from.blockId,
    });
    this.from = from;

    this.to = this._equalPoint(from, to) ? null : to;

    this.reverse = !!reverse;
  }

  static override fromJSON(json: Record<string, unknown>): TextSelection {
    TextSelectionSchema.parse(json);
    return new TextSelection({
      from: json.from as TextRangePoint,
      reverse: !!json.reverse,
      to: json.to as TextRangePoint | null,
    });
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

  empty(): boolean {
    return !!this.to;
  }

  override equals(other: BaseSelection): boolean {
    if (other instanceof TextSelection) {
      return (
        this.blockId === other.blockId &&
        this._equalPoint(other.from, this.from) &&
        this._equalPoint(other.to, this.to)
      );
    }
    return false;
  }

  isCollapsed(): boolean {
    return this.to === null && this.from.length === 0;
  }

  isInSameBlock(): boolean {
    return this.to === null || this.from.blockId === this.to.blockId;
  }

  override toJSON(): Record<string, unknown> {
    return {
      from: this.from,
      reverse: this.reverse,
      to: this.to,
      type: 'text',
    };
  }

  get end(): TextRangePoint {
    return this.reverse ? this.from : this.to ?? this.from;
  }

  get start(): TextRangePoint {
    return this.reverse ? this.to ?? this.from : this.from;
  }
}

declare global {
  namespace BlockSuite {
    interface Selection {
      text: typeof TextSelection;
    }
  }
}
