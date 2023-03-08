import type { BlockTag, RowHost, TagSchema } from '@blocksuite/global/database';
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
  column!: TagSchema;
  @property()
  tag!: BlockTag | null;
}

export interface TagSchemaRenderer<
  Type extends string = string,
  Property extends Record<string, unknown> = Record<string, unknown>,
  BaseValue = unknown
> {
  displayName: string;
  type: Type;
  propertyCreator: () => Property;
  components: TagUIComponents;
}

export type RendererToTagSchema<Renderer extends TagSchemaRenderer> =
  Renderer extends TagSchemaRenderer<infer Type, infer Property, infer Value>
    ? TagSchema<Type, Property, Value>
    : never;

/**
 * @internal
 */
const registry = new Map<TagSchemaRenderer['type'], TagSchemaRenderer>();

export interface TagUIComponents<
  Type extends string = string,
  Property extends Record<string, unknown> = Record<string, unknown>,
  Value = unknown
> {
  Cell: typeof DatabaseCellLitElement;
  CellEditing: typeof DatabaseCellLitElement | false;
  ColumnPropertyEditing: typeof DatabaseCellLitElement;
}

export function defineTagSchemaRenderer<
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
): TagSchemaRenderer<Type, Property, Value> {
  return {
    displayName: config.displayName,
    type,
    propertyCreator,
    components,
  };
}

export function registerTagSchemaRenderer(renderer: TagSchemaRenderer) {
  if (registry.has(renderer.type)) {
    throw new Error('cannot register twice for ' + renderer.type);
  }
  registry.set(renderer.type, renderer);
}

export function listTagSchemaRenderer(): TagSchemaRenderer[] {
  return [...registry.values()];
}

export function getTagSchemaRenderer(
  type: TagSchemaRenderer['type']
): TagSchemaRenderer {
  const renderer = registry.get(type);
  if (!renderer) {
    throw new Error('cannot find renderer');
  }
  return renderer;
}
