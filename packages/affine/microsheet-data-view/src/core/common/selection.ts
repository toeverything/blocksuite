import { BaseSelection, SelectionExtension } from '@blocksuite/block-std';
import { z } from 'zod';

import type {
  GetMicrosheetDataViewSelection,
  MicrosheetDataViewSelection,
} from '../types.js';

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

const MicrosheetSelectionSchema = z.object({
  blockId: z.string(),
  viewSelection: TableViewSelectionSchema,
});

export class MicrosheetSelection extends BaseSelection {
  static override group = 'note';

  static override type = 'microsheet';

  readonly viewSelection: MicrosheetDataViewSelection;

  get viewId() {
    return this.viewSelection.viewId;
  }

  constructor({
    blockId,
    viewSelection,
  }: {
    blockId: string;
    viewSelection: MicrosheetDataViewSelection;
  }) {
    super({
      blockId,
    });

    this.viewSelection = viewSelection;
  }

  static override fromJSON(json: Record<string, unknown>): MicrosheetSelection {
    MicrosheetSelectionSchema.parse(json);
    return new MicrosheetSelection({
      blockId: json.blockId as string,
      viewSelection: json.viewSelection as MicrosheetDataViewSelection,
    });
  }

  override equals(other: BaseSelection): boolean {
    if (!(other instanceof MicrosheetSelection)) {
      return false;
    }
    return this.blockId === other.blockId;
  }

  getSelection<T extends MicrosheetDataViewSelection['type']>(
    type: T
  ): GetMicrosheetDataViewSelection<T> | undefined {
    return this.viewSelection.type === type
      ? (this.viewSelection as GetMicrosheetDataViewSelection<T>)
      : undefined;
  }

  override toJSON(): Record<string, unknown> {
    return {
      type: 'microsheet',
      blockId: this.blockId,
      viewSelection: this.viewSelection,
    };
  }
}

declare global {
  namespace BlockSuite {
    interface Selection {
      microsheet: typeof MicrosheetSelection;
    }
  }
}

export const MicrosheetSelectionExtension =
  SelectionExtension(MicrosheetSelection);
