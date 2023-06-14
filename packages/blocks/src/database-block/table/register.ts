import { ShadowlessElement, WithDisposable } from '@blocksuite/lit';
import type { Page } from '@blocksuite/store';
import { property } from 'lit/decorators.js';
import type { literal } from 'lit/static-html.js';

import type { Column, ColumnType, SetValueOption } from './types.js';

export abstract class TableViewCell extends ShadowlessElement {
  abstract readonly cellType: ColumnType;
}

export abstract class DatabaseCellElement<
  Value,
  Data extends Record<string, unknown> = Record<string, unknown>
> extends WithDisposable(ShadowlessElement) {
  static tag: ReturnType<typeof literal>;

  @property()
  page!: Page;

  @property()
  updateColumnProperty!: (
    apply: (oldProperty: Column<Data>) => Partial<Column<Data>>
  ) => void;
  @property()
  readonly!: boolean;
  @property()
  columnData!: Data;
  @property()
  value: Value | null = null;
  @property()
  onChange!: (value: Value | null, ops?: SetValueOption) => void;
  @property()
  setHeight!: (height: number) => void;
  @property()
  setEditing!: (editing: boolean) => void;
  @property()
  container!: HTMLElement;
}

export interface ColumnRenderer<
  Type extends ColumnType = ColumnType,
  Property extends Record<string, unknown> = Record<string, unknown>,
  Value = unknown
> {
  displayName: string;
  type: Type;
  components: ColumnComponents;
}

export interface ColumnComponents {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Cell: typeof DatabaseCellElement<any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CellEditing: typeof DatabaseCellElement<any, any> | null;
}

export function defineColumnRenderer<
  Type extends ColumnType,
  Property extends Record<string, unknown>,
  Value
>(
  type: Type,
  components: ColumnComponents,
  config: {
    displayName: string;
  }
): ColumnRenderer<Type, Property, Value> {
  return {
    displayName: config.displayName,
    type,
    components,
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
