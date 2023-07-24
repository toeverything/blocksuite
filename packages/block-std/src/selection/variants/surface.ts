import { BaseSelection } from '../base.js';

export class SurfaceSelection extends BaseSelection {
  static override readonly type = 'surface';

  readonly elements: string[];
  readonly editing: boolean;
  readonly by: string | undefined;

  constructor(
    blockId: string,
    elements: string[],
    editing: boolean,
    by?: string
  ) {
    super(blockId);
    this.elements = elements;
    this.editing = editing;
    this.by = by;
  }

  override equals(other: BaseSelection): boolean {
    if (other instanceof SurfaceSelection) {
      return (
        this.blockId === other.blockId &&
        this.elements.length === other.elements.length &&
        this.elements.every((id, idx) => id === other.elements[idx]) &&
        this.by === other.by
      );
    }

    return false;
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: 'surface',
      elements: this.elements,
      blockId: this.blockId,
      editing: this.editing,
      by: this.by,
    };
  }

  static override fromJSON(
    json:
      | Record<string, unknown>
      | { elements: string[]; editing: boolean; blockId?: string; by?: string }
  ): SurfaceSelection {
    return new SurfaceSelection(
      (json.blockId ?? '') as string,
      json.elements as string[],
      json.editing as boolean,
      json.by as string
    );
  }
}
