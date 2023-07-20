import { BaseSelection } from '../base.js';

type TextSelectionProps = {
  blockId: string;
  index: number;
  length: number;
};

export class TextSelection extends BaseSelection {
  static override readonly type = 'text';

  index: number;

  length: number;

  constructor({ blockId, index, length }: TextSelectionProps) {
    super(blockId);
    this.index = index;
    this.length = length;
  }

  empty(): boolean {
    return this.length === 0;
  }

  override equals(other: BaseSelection): boolean {
    if (other instanceof TextSelection) {
      return (
        other.blockId === this.blockId &&
        other.index === this.index &&
        other.length === this.length
      );
    }
    return false;
  }
  override toJSON(): Record<string, unknown> {
    return {
      type: 'text',
      blockId: this.blockId,
      index: this.index,
      length: this.length,
    };
  }

  static override fromJSON(json: Record<string, unknown>): TextSelection {
    return new TextSelection({
      blockId: json.blockId as string,
      index: json.index as number,
      length: json.length as number,
    });
  }
}
