import { BaseSelection } from '../base.js';

export class TextSelection extends BaseSelection {
  static override readonly type = 'text';

  from: number;

  to: number;

  constructor(blockId: string, from: number, to: number) {
    super(blockId);
    this.from = from;
    this.to = to;
  }

  empty(): boolean {
    return this.from === this.to;
  }

  override equals(other: BaseSelection): boolean {
    if (other instanceof TextSelection) {
      return (
        other.blockId === this.blockId &&
        other.from === this.from &&
        other.to === this.to
      );
    }
    return false;
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: 'text',
      blockId: this.blockId,
      from: this.from,
      to: this.to,
    };
  }

  static override fromJSON(json: Record<string, unknown>): TextSelection {
    return new TextSelection(
      json.blockId as string,
      json.from as number,
      json.to as number
    );
  }
}

declare global {
  interface BlockSuiteSelection {
    text: TextSelection;
  }
}
