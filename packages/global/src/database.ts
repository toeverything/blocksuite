import { customElement } from 'lit/decorators.js';
import type { LitElement } from 'lit';

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

export interface TagUISchema {
  CellPreview: { new (): LitElement };
  CellEditing: { new (): LitElement };
  ColumnPropertyEditing: { new (): LitElement };
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
  meta: SchemaMeta;
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
  uiSchema: TagUISchema;
}

// export type TextTagSchema = TagSchema<'text', string>
//
// export type NumberTagSchema = TagSchema<'number', number, {
//   decimal: number;
// }>
//
// export type SelectTagSchema<Selection extends string = string>
//   = TagSchema<'select', string, {
//     selection: Selection[]
//   }>
//
// export type RichTextTagSchema = TagSchema<'rich-text', TextType>

export function defineTagSchemaRenderer<
  Value,
  Type extends string = string,
  Property extends Record<string, unknown> = Record<string, unknown>
>(
  type: Type,
  propertyCreator: () => Property,
  defaultValue: () => Value | null,
  uiSchema: TagUISchema,
  config: {
    displayName: string;
  }
): void {
  const renderer: TagSchemaRenderer<Type, Property, Value> = {
    displayName: config.displayName,
    type,
    propertyCreator,
    uiSchema,
  };
  uiSchema.CellPreview = customElement(`database-${type}-cell-preview`)(
    uiSchema.CellPreview
  );
  uiSchema.CellEditing = customElement(`database-${type}-cell-editing`)(
    uiSchema.CellEditing
  );
  uiSchema.ColumnPropertyEditing = customElement(
    `database-${type}-cell-property-editing`
  )(uiSchema.ColumnPropertyEditing);
  registry.set(renderer.type, renderer);
}

export function listTagSchemaRenderer(): TagSchemaRenderer[] {
  return [...registry.values()];
}
