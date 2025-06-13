import { BaseSelection, SelectionExtension } from '@blocksuite/store';
import z from 'zod';

const DicomSelectionSchema = z.object({
  blockId: z.string(),
});

export class DicomSelection extends BaseSelection {
  static override group = 'note';

  static override type = 'dicom';

  static override fromJSON(json: Record<string, unknown>): DicomSelection {
    const result = DicomSelectionSchema.parse(json);
    return new DicomSelection(result);
  }

  override equals(other: BaseSelection): boolean {
    if (other instanceof DicomSelection) {
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
}

export const DicomSelectionExtension = SelectionExtension(DicomSelection);
