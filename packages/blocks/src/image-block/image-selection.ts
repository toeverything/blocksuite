import { BaseSelection } from '@blocksuite/block-std';
import z from 'zod';

const ImageSelectionSchema = z.object({
  blockId: z.string(),
});

export class ImageSelection extends BaseSelection {
  static override type = 'image';

  static override group = 'note';

  override equals(other: BaseSelection): boolean {
    if (other instanceof ImageSelection) {
      return this.blockId === other.blockId;
    }
    return false;
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      blockId: this.blockId,
    };
  }

  static override fromJSON(json: Record<string, unknown>): ImageSelection {
    ImageSelectionSchema.parse(json);
    return new ImageSelection({
      blockId: json.blockId as string,
    });
  }
}

declare global {
  namespace BlockSuite {
    interface Selection {
      image: typeof ImageSelection;
    }
  }
}
