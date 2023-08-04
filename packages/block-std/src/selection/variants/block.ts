import { PathFinder } from '../../store/index.js';
import { BaseSelection } from '../base.js';

export class BlockSelection extends BaseSelection {
  static override type = 'block';

  override equals(other: BaseSelection): boolean {
    if (other instanceof BlockSelection) {
      return PathFinder.equals(this.path, other.path);
    }
    return false;
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: 'block',
      path: this.path,
    };
  }

  static override fromJSON(json: Record<string, unknown>): BlockSelection {
    return new BlockSelection({
      path: json.path as string[],
    });
  }
}

declare global {
  interface BlockSuiteSelection {
    block: typeof BlockSelection;
  }
}
