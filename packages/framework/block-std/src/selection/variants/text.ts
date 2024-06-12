import z from 'zod';

import { BaseSelection } from '../base.js';

export type TextRangePoint = {
  blockId: string;
  index: number;
  length: number;
};

export type TextSelectionProps = {
  from: TextRangePoint;
  to: TextRangePoint | null;
  reverse?: boolean;
};

const TextSelectionSchema = z.object({
  from: z.object({
    blockId: z.string(),
    index: z.number(),
    length: z.number(),
  }),
  to: z
    .object({
      blockId: z.string(),
      index: z.number(),
      length: z.number(),
    })
    .nullable(),
  // The `optional()` is for backward compatibility,
  // since `reverse` may not exist in remote selection.
  reverse: z.boolean().optional(),
});

export class TextSelection extends BaseSelection {
  get start(): TextRangePoint {
    return this.reverse ? this.to ?? this.from : this.from;
  }

  get end(): TextRangePoint {
    return this.reverse ? this.from : this.to ?? this.from;
  }

  static override type = 'text';

  static override group = 'note';

  from: TextRangePoint;

  to: TextRangePoint | null;

  reverse: boolean;

  constructor({ from, to, reverse }: TextSelectionProps) {
    super({
      blockId: from.blockId,
    });
    this.from = from;

    this.to = this._equalPoint(from, to) ? null : to;

    this.reverse = !!reverse;
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

  override toJSON(): Record<string, unknown> {
    return {
      type: 'text',
      from: this.from,
      to: this.to,
      reverse: this.reverse,
    };
  }

  isCollapsed(): boolean {
    return this.to === null && this.from.length === 0;
  }

  isInSameBlock(): boolean {
    return this.to === null || this.from.blockId === this.to.blockId;
  }

  static override fromJSON(json: Record<string, unknown>): TextSelection {
    TextSelectionSchema.parse(json);
    return new TextSelection({
      from: json.from as TextRangePoint,
      to: json.to as TextRangePoint | null,
      reverse: !!json.reverse,
    });
  }
}

declare global {
  namespace BlockSuite {
    interface Selection {
      text: typeof TextSelection;
    }
  }
}
