import z from 'zod';

import { BaseSelection } from '../base.js';

const CursorSelectionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export class CursorSelection extends BaseSelection {
  static override group = 'edgeless';

  static override type = 'cursor';

  readonly x: number;

  readonly y: number;

  constructor(x: number, y: number) {
    super({ blockId: '[edgeless-cursor]' });
    this.x = x;
    this.y = y;
  }

  static override fromJSON(json: Record<string, unknown>): CursorSelection {
    CursorSelectionSchema.parse(json);
    return new CursorSelection(json.x as number, json.y as number);
  }

  override equals(other: BaseSelection): boolean {
    if (other instanceof CursorSelection) {
      return this.x === other.x && this.y === other.y;
    }

    return false;
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: 'cursor',
      x: this.x,
      y: this.y,
    };
  }
}

declare global {
  namespace BlockSuite {
    interface Selection {
      cursor: typeof CursorSelection;
    }
  }
}
