import { BaseSelection, SelectionExtension } from '@blocksuite/block-std';
import { z } from 'zod';

import type { DataViewSelection, GetDataViewSelection } from '../types.js';

const TableViewSelectionSchema = z.union([
  z.object({
    viewId: z.string(),
    type: z.literal('table'),
    selectionType: z.literal('area'),
    rowsSelection: z.object({
      start: z.number(),
      end: z.number(),
    }),
    columnsSelection: z.object({
      start: z.number(),
      end: z.number(),
    }),
    focus: z.object({
      rowIndex: z.number(),
      columnIndex: z.number(),
    }),
    isEditing: z.boolean(),
  }),
  z.object({
    viewId: z.string(),
    type: z.literal('table'),
    selectionType: z.literal('row'),
    rows: z.array(
      z.object({ id: z.string(), groupKey: z.string().optional() })
    ),
  }),
]);

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
    DatabaseSelectionSchema.parse(json);
    return new DatabaseSelection({
      blockId: json.blockId as string,
      viewSelection: json.viewSelection as DataViewSelection,
    });
  }

  override equals(other: BaseSelection): boolean {
    if (!(other instanceof DatabaseSelection)) {
      return false;
    }
    return this.blockId === other.blockId;
  }

  getSelection<T extends DataViewSelection['type']>(
    type: T
  ): GetDataViewSelection<T> | undefined {
    return this.viewSelection.type === type
      ? (this.viewSelection as GetDataViewSelection<T>)
      : undefined;
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: 'database',
      blockId: this.blockId,
      viewSelection: this.viewSelection,
    };
  }
}

declare global {
  namespace BlockSuite {
    interface Selection {
      database: typeof DatabaseSelection;
    }
  }
}

export const DatabaseSelectionExtension = SelectionExtension(DatabaseSelection);
