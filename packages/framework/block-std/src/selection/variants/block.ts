import z from 'zod';

import { BaseSelection } from '../base.js';

const BlockSelectionSchema = z.object({
  blockId: z.string(),
});

export class BlockSelection extends BaseSelection {
  static override group = 'note';

  static override type = 'block';

  static override fromJSON(json: Record<string, unknown>): BlockSelection {
    BlockSelectionSchema.parse(json);
    return new BlockSelection({
      blockId: json.blockId as string,
    });
  }

  override equals(other: BaseSelection): boolean {
    if (other instanceof BlockSelection) {
      return this.blockId === other.blockId;
    }
    return false;
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: 'block',
      blockId: this.blockId,
    };
  }
}

declare global {
  namespace BlockSuite {
    interface Selection {
      block: typeof BlockSelection;
    }
  }
}
