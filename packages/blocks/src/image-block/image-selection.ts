import { BaseSelection } from '@blocksuite/block-std';
import z from 'zod';

const ImageSelectionSchema = z.object({
  blockId: z.string(),
});

export class ImageSelection extends BaseSelection {
  static override group = 'note';

  static override type = 'image';

  static override fromJSON(json: Record<string, unknown>): ImageSelection {
    ImageSelectionSchema.parse(json);
    return new ImageSelection({
      blockId: json.blockId as string,
    });
  }

  override equals(other: BaseSelection): boolean {
    if (other instanceof ImageSelection) {
      return this.blockId === other.blockId;
    }
    return false;
  }

  override toJSON(): Record<string, unknown> {
    return {
      blockId: this.blockId,
      type: this.type,
    };
  }
}

declare global {
  namespace BlockSuite {
    interface Selection {
      image: typeof ImageSelection;
    }
  }
}
