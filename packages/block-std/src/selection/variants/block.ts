import z from 'zod';

import { PathFinder } from '../../utils/index.js';
import { BaseSelection } from '../base.js';

const BlockSelectionSchema = z.object({
  path: z.array(z.string()),
});

export class BlockSelection extends BaseSelection {
  static override type = 'block';
  static override group = 'note';

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
    BlockSelectionSchema.parse(json);
    return new BlockSelection({
      path: json.path as string[],
    });
  }
}

declare global {
  namespace BlockSuite {
    interface Selection {
      block: typeof BlockSelection;
    }
  }
}
