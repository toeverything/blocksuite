import { BaseSelection } from '../base.js';

export class BlockSelection extends BaseSelection {
  static override readonly type = 'block';

  override readonly type = 'block';

  override equals(other: BaseSelection): boolean {
    if (other instanceof BlockSelection) {
      return other.blockId === this.blockId;
    }
    return false;
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: 'block',
      blockId: this.blockId,
    };
  }

  static override fromJSON(json: Record<string, unknown>): BlockSelection {
    return new BlockSelection(json.blockId as string);
  }
}

declare global {
  interface BlockSuiteSelection {
    block: typeof BlockSelection;
  }
}
