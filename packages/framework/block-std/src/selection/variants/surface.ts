import z from 'zod';

import { BaseSelection } from '../base.js';

const SurfaceSelectionSchema = z.object({
  elements: z.array(z.string()),
  editing: z.boolean(),
  inoperable: z.boolean().optional(),
});

export class SurfaceSelection extends BaseSelection {
  static override type = 'surface';

  static override group = 'edgeless';

  readonly elements: string[];

  readonly editing: boolean;

  readonly inoperable: boolean;

  constructor(
    blockId: string,
    elements: string[],
    editing: boolean,
    inoperable = false
  ) {
    super({ blockId });

    this.elements = elements;
    this.editing = editing;
    this.inoperable = inoperable;
  }

  isEmpty() {
    return this.elements.length === 0 && !this.editing;
  }

  override equals(other: BaseSelection): boolean {
    if (other instanceof SurfaceSelection) {
      return (
        this.blockId === other.blockId &&
        this.elements.length === other.elements.length &&
        this.elements.every((id, idx) => id === other.elements[idx]) &&
        this.editing === other.editing &&
        this.inoperable === other.inoperable
      );
    }

    return false;
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: 'surface',
      blockId: this.blockId,
      elements: this.elements,
      editing: this.editing,
      inoperable: this.inoperable,
    };
  }

  static override fromJSON(
    json:
      | Record<string, unknown>
      | {
          blockId: string[];
          elements: string[];
          editing: boolean;
          inoperable?: boolean;
        }
  ): SurfaceSelection {
    SurfaceSelectionSchema.parse(json);
    return new SurfaceSelection(
      json.blockId as string,
      json.elements as string[],
      json.editing as boolean,
      (json.inoperable as boolean) || false
    );
  }
}

declare global {
  namespace BlockSuite {
    interface Selection {
      surface: typeof SurfaceSelection;
    }
  }
}
