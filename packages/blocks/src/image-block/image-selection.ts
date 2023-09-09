import { BaseSelection, PathFinder } from '@blocksuite/block-std';
import z from 'zod';

const ImageSelectionSchema = z.object({
  path: z.array(z.string()),
});

export class ImageSelection extends BaseSelection {
  static override type = 'image';
  static override group = 'note';

  override equals(other: BaseSelection): boolean {
    if (other instanceof ImageSelection) {
      return PathFinder.equals(this.path, other.path);
    }
    return false;
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      path: this.path,
    };
  }

  static override fromJSON(json: Record<string, unknown>): ImageSelection {
    ImageSelectionSchema.parse(json);
    return new ImageSelection({
      path: json.path as string[],
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
