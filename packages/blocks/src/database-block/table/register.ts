import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { BaseBlockModel, Page } from '@blocksuite/store';
import { property } from 'lit/decorators.js';
import type { literal } from 'lit/static-html.js';

import type { SelectColumnData } from '../common/column-manager.js';
import type { TableMixColumn } from '../common/view-manager.js';
import type { DatabaseBlockModel } from '../database-model.js';
import type { Cell, ColumnType, RowHost } from './types.js';

export abstract class TableViewCell extends ShadowlessElement {
  abstract readonly cellType: ColumnType;
}

export abstract class DatabaseCellElement<
  Value,
  Data extends Record<string, unknown> = Record<string, unknown>
> extends WithDisposable(ShadowlessElement) {
  static tag: ReturnType<typeof literal>;

  @property()
  rowHost!: RowHost<Value, SelectColumnData>;
  @property()
  databaseModel!: DatabaseBlockModel;
  @property()
  rowModel!: BaseBlockModel;
  @property()
  column!: TableMixColumn<Data>;
  @property()
  cell: Cell<Value> | null = null;
}

export interface ColumnRenderer<
  Type extends ColumnType = ColumnType,
  Property extends Record<string, unknown> = Record<string, unknown>,
  Value = unknown
> {
  displayName: string;
  type: Type;
  propertyCreator: () => Property;
  components: ColumnComponents;
  defaultValue: (page: Page) => Value;
}

export interface ColumnComponents<Value = unknown> {
  Cell: typeof DatabaseCellElement<Value>;
  CellEditing: typeof DatabaseCellElement<Value> | null;
}

export function defineColumnRenderer<
  Type extends ColumnType,
  Property extends Record<string, unknown>,
  Value
>(
  type: Type,
  propertyCreator: () => Property,
  defaultValue: (page: Page) => Value,
  components: ColumnComponents,
  config: {
    displayName: string;
  }
): ColumnRenderer<Type, Property, Value> {
  return {
    displayName: config.displayName,
    type,
    propertyCreator,
    components,
    defaultValue,
  };
}

export class ColumnRendererHelper {
  private _columns = new Map<ColumnRenderer['type'], ColumnRenderer>();

  register(renderer: ColumnRenderer) {
    const columns = this._columns;
    if (columns.has(renderer.type)) {
      throw new Error('cannot register twice for ' + renderer.type);
    }
    columns.set(renderer.type, renderer);
  }

  get(type: ColumnRenderer['type']): ColumnRenderer {
    const renderer = this._columns.get(type);
    if (!renderer) {
      throw new Error('cannot find renderer');
    }
    return renderer;
  }

  list(): ColumnRenderer[] {
    return [...this._columns.values()];
  }
}
