import type { DataViewSelection } from '@labre/data-view';
import {
  KanbanViewSelectionWithTypeSchema,
  TableViewSelectionWithTypeSchema,
} from '@labre/data-view/view-presets';
import { BaseSelection, SelectionExtension } from '@labre/store';
import { z } from 'zod';

const ViewSelectionSchema = z.union([
  TableViewSelectionWithTypeSchema,
  KanbanViewSelectionWithTypeSchema,
]);

const DatabaseSelectionSchema = z.object({
  blockId: z.string(),
  viewSelection: ViewSelectionSchema,
});

export class DatabaseSelection extends BaseSelection {
  static override group = 'note';

  static override type = 'database';

  readonly viewSelection: DataViewSelection;

  get viewId() {
    return this.viewSelection.viewId;
  }

  constructor({
    blockId,
    viewSelection,
  }: {
    blockId: string;
    viewSelection: DataViewSelection;
  }) {
    super({
      blockId,
    });

    this.viewSelection = viewSelection;
  }

  static override fromJSON(json: Record<string, unknown>): DatabaseSelection {
    const { blockId, viewSelection } = DatabaseSelectionSchema.parse(json);
    return new DatabaseSelection({
      blockId,
      viewSelection: viewSelection,
    });
  }

  override equals(other: BaseSelection): boolean {
    if (!(other instanceof DatabaseSelection)) {
      return false;
    }
    return this.blockId === other.blockId;
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: 'database',
      blockId: this.blockId,
      viewSelection: this.viewSelection,
    };
  }
}

export const DatabaseSelectionExtension = SelectionExtension(DatabaseSelection);
