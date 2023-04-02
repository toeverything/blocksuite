import type {
  BlockColumn,
  ColumnSchema,
  SelectProperty,
} from '@blocksuite/global/database';
import { assertExists } from '@blocksuite/global/utils';
import * as Y from 'yjs';

import type { BaseBlockModel } from '../base.js';
import type { Page } from './page.js';

type SerializedNestedColumns = {
  // row
  [key: string]: {
    // column
    [key: string]: BlockColumn;
  };
};

export class DatabaseManager {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  protected get yColumns() {
    assertExists(this.page.root?.columns);
    return this.page.root.columns as Y.Map<Y.Map<unknown>>;
  }

  protected get yColumnSchema() {
    assertExists(this.page.root?.columnSchema);
    return this.page.root.columnSchema as Y.Map<unknown>;
  }

  get columnJSON(): SerializedNestedColumns {
    return this.yColumns.toJSON();
  }

  getColumnSchema(id: ColumnSchema['id']): ColumnSchema | null {
    return (this.yColumnSchema.get(id) ?? null) as ColumnSchema | null;
  }

  updateColumnSchema(
    schema: Omit<ColumnSchema, 'id'> & { id?: ColumnSchema['id'] }
  ): string {
    const id = schema.id ?? this.page.createId();
    this.page.transact(() => this.yColumnSchema.set(id, { ...schema, id }));
    return id;
  }

  deleteColumnSchema(id: ColumnSchema['id']) {
    this.page.transact(() => this.yColumnSchema.delete(id));
  }

  getColumn(model: BaseBlockModel, schema: ColumnSchema): BlockColumn | null {
    const yColumns = this.yColumns.get(model.id);
    const yColumnMap = (yColumns?.get(schema.id) as Y.Map<unknown>) ?? null;
    if (!yColumnMap) return null;

    return {
      columnId: yColumnMap.get('columnId') as string,
      value: yColumnMap.get('value') as unknown,
    };
  }

  updateColumn(columnId: string, column: BlockColumn) {
    const hasColumn = this.yColumns.has(columnId);
    let yColumns: Y.Map<unknown>;
    if (!hasColumn) {
      yColumns = new Y.Map();
    } else {
      yColumns = this.yColumns.get(columnId) as Y.Map<unknown>;
    }
    this.page.transact(() => {
      if (!hasColumn) {
        this.yColumns.set(columnId, yColumns);
      }
      // Related issue: https://github.com/yjs/yjs/issues/255
      const yColumnMap = new Y.Map();
      yColumnMap.set('columnId', column.columnId);
      yColumnMap.set('value', column.value);
      yColumns.set(column.columnId, yColumnMap);
    });
  }

  updateSelectedColumn(
    rowId: string,
    columnId: string,
    oldValue: string,
    value?: string
  ) {
    this.page.transact(() => {
      const yColumns = this.yColumns.get(rowId);
      assertExists(yColumns);
      const cell = yColumns.get(columnId) as Y.Map<string[]> | undefined;
      if (!cell) return;

      const selected = cell.get('value') as string[];
      let newSelected = [...selected];
      if (value !== undefined) {
        // rename tag
        const index = newSelected.indexOf(oldValue);
        newSelected[index] = value;
      } else {
        // delete tag
        newSelected = selected.filter(item => item !== oldValue);
      }

      const yColumnMap = new Y.Map();
      yColumnMap.set('schemaId', columnId);
      yColumnMap.set('value', newSelected);
      yColumns.set(columnId, yColumnMap);
    });
  }

  copyColumn(fromId: ColumnSchema['id'], toId: ColumnSchema['id']) {
    this.page.transact(() => {
      this.yColumns.forEach(column => {
        const copyColumn = column.get(fromId) as Y.Map<unknown>;
        if (copyColumn) {
          const columnMap = new Y.Map();
          columnMap.set('columnId', toId);
          columnMap.set('value', copyColumn.get('value'));
          column.set(toId, columnMap);
        }
      });
    });
  }

  deleteColumn(id: string) {
    this.page.transact(() => {
      this.yColumns.forEach(yColumn => yColumn.delete(id));
    });
  }

  convertColumn(columnId: string, newType: 'select' | 'rich-text') {
    this.page.transact(() => {
      this.yColumns.forEach(yColumn => {
        const yTargetColumn = yColumn.get(columnId) as Y.Map<unknown>;
        if (!yTargetColumn) return;

        if (newType === 'select') {
          const value = yTargetColumn.get('value');
          if (!value) return;

          const yColumnMap = new Y.Map();
          yColumnMap.set('columnId', columnId);
          yColumnMap.set('value', [(value as string[])[0]]);
          yColumn.set(columnId, yColumnMap);
        } else if (newType === 'rich-text') {
          const value = yTargetColumn.get('value');
          if (!value) return;

          const yColumnMap = new Y.Map();
          yColumnMap.set('columnId', columnId);
          yColumnMap.set('value', new Y.Text((value as number) + ''));
          yColumn.set(columnId, yColumnMap);
        }
      });
    });
  }

  renameColumnValue(
    columnId: string,
    oldValue: SelectProperty,
    newValue: SelectProperty
  ) {
    this.page.transact(() => {
      this.yColumns.forEach(yColumn => {
        const cell = yColumn.get(columnId) as
          | Y.Map<SelectProperty[]>
          | undefined;
        if (!cell) return;

        const selected = cell.get('value') as SelectProperty[];
        const newSelected = [...selected];
        const index = newSelected.indexOf(oldValue);
        newSelected[index] = newValue;

        const yColumnMap = new Y.Map();
        yColumnMap.set('schemaId', columnId);
        yColumnMap.set('value', newSelected);
        yColumn.set(columnId, yColumnMap);
      });
    });
  }

  deleteColumnValue(columnId: string, newValue: SelectProperty) {
    this.page.transact(() => {
      this.yColumns.forEach(yColumn => {
        const cell = yColumn.get(columnId) as
          | Y.Map<SelectProperty[]>
          | undefined;
        if (!cell) return;

        const selected = cell.get('value') as SelectProperty[];
        let newSelected = [...selected];
        newSelected = selected.filter(item => item.value !== newValue.value);

        const yColumnMap = new Y.Map();
        yColumnMap.set('schemaId', columnId);
        yColumnMap.set('value', newSelected);
        yColumn.set(columnId, yColumnMap);
      });
    });
  }
}
