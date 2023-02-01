import { property } from 'lit/decorators.js';
import { LitElement } from 'lit';
import type { DatabaseBlockModel } from '@blocksuite/blocks';
import type { BaseBlockModel } from '@blocksuite/store';
import type { literal } from 'lit/static-html.js';
import { Page } from '@blocksuite/store';

export interface RowHost {
  setEditing(isEditing: boolean): void;
}

export abstract class DatabaseCellLitElement extends LitElement {
  static tag: ReturnType<typeof literal>;
  @property()
  rowHost!: RowHost;
  @property({ hasChanged: () => true })
  databaseModel!: DatabaseBlockModel;
  @property({ hasChanged: () => true })
  rowModel!: BaseBlockModel;
  @property()
  column!: TagSchema;
  @property()
  tag!: BlockTag | null;
}

/**
 * @internal
 */
const registry = new Map<TagSchemaRenderer['type'], TagSchemaRenderer>();

export interface SchemaMeta {
  /**
   * color of the tag
   */
  color: `#${string}`;
  /**
   * width of a column
   */
  width: number; // px
  /**
   * whether this display in the table
   */
  hide: boolean;
}

export interface UISchema {
  new (): LitElement;
  tagName: string;
}

export interface TagUIComponents<
  Type extends string = string,
  Property extends Record<string, unknown> = Record<string, unknown>,
  Value = unknown
> {
  CellPreview: typeof DatabaseCellLitElement;
  CellEditing: typeof DatabaseCellLitElement;
  ColumnPropertyEditing: typeof DatabaseCellLitElement;
}

export type TagProperty<Property extends Record<string, unknown>> = Property;

export interface TagSchema<
  Type extends string = string,
  Property extends Record<string, unknown> = Record<string, unknown>,
  BaseValue = unknown
> {
  /**
   * each instance of tag type has its own unique uuid
   */
  id: string;
  type: Type;
  /**
   * column name
   */
  name: string;
  internalProperty: SchemaMeta;
  property: TagProperty<Property>;
  /**
   * this value is just for hold the `BaseValue`,
   *  don't use this value in the runtime.
   */
  __$TYPE_HOLDER$__?: BaseValue;
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

export type BlockTag<Schema extends TagSchema = TagSchema> = {
  schemaId: Schema['id'];
  value: Schema extends TagSchema<infer _, infer __, infer Value>
    ? Value
    : never;
};

export function defineTagSchemaRenderer<
  Type extends string,
  Property extends Record<string, unknown>,
  Value
>(
  type: Type,
  propertyCreator: () => Property,
  defaultValue: (page: Page) => Value | null,
  components: {
    CellPreview: typeof DatabaseCellLitElement;
    CellEditing: typeof DatabaseCellLitElement;
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
