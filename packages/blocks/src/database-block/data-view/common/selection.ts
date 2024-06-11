import { BaseSelection } from '@blocksuite/block-std';
import { z } from 'zod';

import type { DataViewSelection, GetDataViewSelection } from '../types.js';

const TableViewSelectionSchema = z.object({
  viewId: z.string(),
  type: z.literal('table'),
  rowsSelection: z
    .object({
      start: z.number(),
      end: z.number(),
    })
    .optional(),
  columnsSelection: z
    .object({
      start: z.number(),
      end: z.number(),
    })
    .optional(),
  focus: z.object({
    rowIndex: z.number(),
    columnIndex: z.number(),
  }),
  isEditing: z.boolean(),
});

const KanbanCellSelectionSchema = z.object({
  selectionType: z.literal('cell'),
  groupKey: z.string(),
  cardId: z.string(),
  columnId: z.string(),
  isEditing: z.boolean(),
});

const KanbanCardSelectionSchema = z.object({
  selectionType: z.literal('card'),
  cards: z.array(
    z.object({
      groupKey: z.string(),
      cardId: z.string(),
    })
  ),
});

const KanbanGroupSelectionSchema = z.object({
  selectionType: z.literal('group'),
  groupKeys: z.array(z.string()),
});

const DatabaseSelectionSchema = z.object({
  blockId: z.string(),
  viewSelection: z.union([
    TableViewSelectionSchema,
    KanbanCellSelectionSchema,
    KanbanCardSelectionSchema,
    KanbanGroupSelectionSchema,
  ]),
});

export class DatabaseSelection extends BaseSelection {
  static override type = 'database';

  static override group = 'note';

  readonly viewSelection: DataViewSelection;

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

  get viewId() {
    return this.viewSelection.viewId;
  }

  getSelection<T extends DataViewSelection['type']>(
    type: T
  ): GetDataViewSelection<T> | undefined {
    return this.viewSelection.type === type
      ? (this.viewSelection as GetDataViewSelection<T>)
      : undefined;
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

  static override fromJSON(json: Record<string, unknown>): DatabaseSelection {
    DatabaseSelectionSchema.parse(json);
    return new DatabaseSelection({
      blockId: json.blockId as string,
      viewSelection: json.viewSelection as DataViewSelection,
    });
  }
}

declare global {
  namespace BlockSuite {
    interface Selection {
      database: typeof DatabaseSelection;
    }
  }
}
