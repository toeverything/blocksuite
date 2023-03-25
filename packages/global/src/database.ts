export interface RowHost<Value = unknown> extends HTMLElement {
  setEditing(isEditing: boolean): void;
  setHeight(height: number): void;
  setValue(value: Value): void;
  updateColumnProperty(
    apply: (oldProperty: Record<string, unknown>) => Record<string, unknown>
  ): void;
}

export interface SchemaInternalProperty {
  /**
   * color of the column
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

export type ColumnSchemaProperty<Property extends Record<string, unknown>> =
  Property;

export interface ColumnSchema<
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
  internalProperty: SchemaInternalProperty;
  property: ColumnSchemaProperty<Property>;
  /**
   * this value is just for hold the `BaseValue`,
   *  don't use this value in the runtime.
   */
  __$TYPE_HOLDER$__?: BaseValue;
}

export type BlockColumn<Schema extends ColumnSchema = ColumnSchema> = {
  schemaId: Schema['id'];
  value: Schema extends ColumnSchema<infer _, infer __, infer Value>
    ? Value
    : never;
};
