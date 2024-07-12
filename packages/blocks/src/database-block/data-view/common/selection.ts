import { BaseSelection } from '@blocksuite/block-std';
import { z } from 'zod';

import type { DataViewSelection, GetDataViewSelection } from '../types.js';

const TableViewSelectionSchema = z.object({
  columnsSelection: z
    .object({
      end: z.number(),
      start: z.number(),
    })
    .optional(),
  focus: z.object({
    columnIndex: z.number(),
    rowIndex: z.number(),
  }),
  isEditing: z.boolean(),
  rowsSelection: z
    .object({
      end: z.number(),
      start: z.number(),
    })
    .optional(),
  type: z.literal('table'),
  viewId: z.string(),
});

const KanbanCellSelectionSchema = z.object({
  cardId: z.string(),
  columnId: z.string(),
  groupKey: z.string(),
  isEditing: z.boolean(),
  selectionType: z.literal('cell'),
});

const KanbanCardSelectionSchema = z.object({
  cards: z.array(
    z.object({
      cardId: z.string(),
      groupKey: z.string(),
    })
  ),
  selectionType: z.literal('card'),
});

const KanbanGroupSelectionSchema = z.object({
  groupKeys: z.array(z.string()),
  selectionType: z.literal('group'),
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
      blockId: this.blockId,
      type: 'database',
      viewSelection: this.viewSelection,
    };
  }

  get viewId() {
    return this.viewSelection.viewId;
  }
}

declare global {
  namespace BlockSuite {
    interface Selection {
      database: typeof DatabaseSelection;
    }
  }
}
