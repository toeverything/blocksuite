import z from 'zod';

import { BaseSelection } from '../base.js';

const SurfaceSelectionSchema = z.object({
  editing: z.boolean(),
  elements: z.array(z.string()),
  inoperable: z.boolean().optional(),
});

export class SurfaceSelection extends BaseSelection {
  static override group = 'edgeless';

  static override type = 'surface';

  readonly editing: boolean;

  readonly elements: string[];

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

  static override fromJSON(
    json:
      | {
          blockId: string[];
          editing: boolean;
          elements: string[];
          inoperable?: boolean;
        }
      | Record<string, unknown>
  ): SurfaceSelection {
    SurfaceSelectionSchema.parse(json);
    return new SurfaceSelection(
      json.blockId as string,
      json.elements as string[],
      json.editing as boolean,
      (json.inoperable as boolean) || false
    );
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

  isEmpty() {
    return this.elements.length === 0 && !this.editing;
  }

  override toJSON(): Record<string, unknown> {
    return {
      blockId: this.blockId,
      editing: this.editing,
      elements: this.elements,
      inoperable: this.inoperable,
      type: 'surface',
    };
  }
}

declare global {
  namespace BlockSuite {
    interface Selection {
      surface: typeof SurfaceSelection;
    }
  }
}
