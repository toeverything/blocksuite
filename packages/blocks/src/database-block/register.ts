import type {
  BlockColumn,
  ColumnSchema,
  RowHost,
} from '@blocksuite/global/database';
import type { Page } from '@blocksuite/store';
import type { BaseBlockModel } from '@blocksuite/store';
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import type { literal } from 'lit/static-html.js';

import type { DatabaseBlockModel } from './database-model.js';

export abstract class DatabaseCellLitElement extends LitElement {
  static tag: ReturnType<typeof literal>;
  @property()
  rowHost!: RowHost;
  @property()
  databaseModel!: DatabaseBlockModel;
  @property()
  rowModel!: BaseBlockModel;
  @property()
  columnSchema!: ColumnSchema;
  @property()
  column!: BlockColumn | null;
}

export interface ColumnSchemaRenderer<
  Type extends string = string,
  Property extends Record<string, unknown> = Record<string, unknown>,
  BaseValue = unknown
> {
  displayName: string;
  type: Type;
  propertyCreator: () => Property;
  components: ColumnUIComponents;
}

export type RendererToColumnSchema<Renderer extends ColumnSchemaRenderer> =
  Renderer extends ColumnSchemaRenderer<infer Type, infer Property, infer Value>
    ? ColumnSchema<Type, Property, Value>
    : never;

/**
 * @internal
 */
const registry = new Map<ColumnSchemaRenderer['type'], ColumnSchemaRenderer>();

export interface ColumnUIComponents<
  Type extends string = string,
  Property extends Record<string, unknown> = Record<string, unknown>,
  Value = unknown
> {
  Cell: typeof DatabaseCellLitElement;
  CellEditing: typeof DatabaseCellLitElement | false;
  ColumnPropertyEditing: typeof DatabaseCellLitElement;
}

export function defineColumnSchemaRenderer<
  Type extends string,
  Property extends Record<string, unknown>,
  Value
>(
  type: Type,
  propertyCreator: () => Property,
  defaultValue: (page: Page) => Value | null,
  components: {
    Cell: typeof DatabaseCellLitElement;
    CellEditing: typeof DatabaseCellLitElement | false;
    ColumnPropertyEditing: typeof DatabaseCellLitElement;
  },
  config: {
    displayName: string;
  }
): ColumnSchemaRenderer<Type, Property, Value> {
  return {
    displayName: config.displayName,
    type,
    propertyCreator,
    components,
  };
}

export function registerColumnSchemaRenderer(renderer: ColumnSchemaRenderer) {
  if (registry.has(renderer.type)) {
    throw new Error('cannot register twice for ' + renderer.type);
  }
  registry.set(renderer.type, renderer);
}

export function listColumnSchemaRenderer(): ColumnSchemaRenderer[] {
  return [...registry.values()];
}

export function getColumnSchemaRenderer(
  type: ColumnSchemaRenderer['type']
): ColumnSchemaRenderer {
  const renderer = registry.get(type);
  if (!renderer) {
    throw new Error('cannot find renderer');
  }
  return renderer;
}
