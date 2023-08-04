import { BaseSelection } from '../base.js';

export class SurfaceSelection extends BaseSelection {
  static override type = 'surface';

  readonly elements: string[];
  readonly editing: boolean;

  constructor(elements: string[], editing: boolean) {
    super({ path: [] });
    this.elements = elements;
    this.editing = editing;
  }

  isEmpty() {
    return this.elements.length === 0 && !this.editing;
  }

  override equals(other: BaseSelection): boolean {
    if (other instanceof SurfaceSelection) {
      return (
        this.blockId === other.blockId &&
        this.elements.length === other.elements.length &&
        this.elements.every((id, idx) => id === other.elements[idx])
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
    };
  }

  static override fromJSON(
    json: Record<string, unknown> | { elements: string[]; editing: boolean }
  ): SurfaceSelection {
    return new SurfaceSelection(
      json.elements as string[],
      json.editing as boolean
    );
  }
}

declare global {
  interface BlockSuiteSelection {
    surface: typeof SurfaceSelection;
  }
}
