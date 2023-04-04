import type {
  Cell,
  Column,
  ColumnType,
  RowHost,
} from '@blocksuite/global/database';
import type { Page } from '@blocksuite/store';
import type { BaseBlockModel } from '@blocksuite/store';
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import type { literal } from 'lit/static-html.js';

import type { DatabaseBlockModel } from './database-model.js';

export abstract class DatabaseCellElement<Value> extends LitElement {
  static tag: ReturnType<typeof literal>;
  @property()
  rowHost!: RowHost<Value>;
  @property()
  databaseModel!: DatabaseBlockModel;
  @property()
  rowModel!: BaseBlockModel;
  @property()
  columnSchema!: Column;
  @property()
  cell!: Cell | null;
}

export interface ColumnRenderer<
  Type extends ColumnType = ColumnType,
  Property extends Record<string, unknown> = Record<string, unknown>,
  BaseValue = unknown
> {
  displayName: string;
  type: Type;
  propertyCreator: () => Property;
  components: ColumnComponents;
}

/**
 * @internal
 */
const registry = new Map<ColumnRenderer['type'], ColumnRenderer>();

export interface ColumnComponents<
  Type extends string = string,
  Property extends Record<string, unknown> = Record<string, unknown>,
  Value = unknown
> {
  Cell: typeof DatabaseCellElement<Value>;
  CellEditing: typeof DatabaseCellElement<Value> | false;
  ColumnPropertyEditing: typeof DatabaseCellElement<Value>;
}

export function defineColumnRenderer<
  Type extends ColumnType,
  Property extends Record<string, unknown>,
  Value
>(
  type: Type,
  propertyCreator: () => Property,
  defaultValue: (page: Page) => Value | null,
  components: {
    Cell: typeof DatabaseCellElement<Value>;
    CellEditing: typeof DatabaseCellElement<Value> | false;
    ColumnPropertyEditing: typeof DatabaseCellElement<Value>;
  },
  config: {
    displayName: string;
  }
): ColumnRenderer<Type, Property, Value> {
  return {
    displayName: config.displayName,
    type,
    propertyCreator,
    components,
  };
}

export function registerColumnRenderer(renderer: ColumnRenderer) {
  if (registry.has(renderer.type)) {
    throw new Error('cannot register twice for ' + renderer.type);
  }
  registry.set(renderer.type, renderer);
}

export function listColumnRenderer(): ColumnRenderer[] {
  return [...registry.values()];
}

export function getColumnRenderer(
  type: ColumnRenderer['type']
): ColumnRenderer {
  const renderer = registry.get(type);
  if (!renderer) {
    throw new Error('cannot find renderer');
  }
  return renderer;
}
