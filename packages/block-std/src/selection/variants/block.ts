import { BaseSelection } from '../base.js';

export class BlockSelection extends BaseSelection {
  static override type = 'block';

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
      path: this.path,
    };
  }

  static override fromJSON(json: Record<string, unknown>): BlockSelection {
    return new BlockSelection({
      blockId: json.blockId as string,
      path: json.path as string[],
    });
  }
}

declare global {
  interface BlockSuiteSelection {
    block: typeof BlockSelection;
  }
}
