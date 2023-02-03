export interface RowHost {
  setEditing(isEditing: boolean): void;
  // todo: type improvement
  setValue(value: unknown): void;
  updateColumnProperty(
    apply: (oldProperty: Record<string, unknown>) => Record<string, unknown>
  ): void;
}

export interface SchemaInternalProperty {
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

export type TagSchemaProperty<Property extends Record<string, unknown>> =
  Property;

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
  internalProperty: SchemaInternalProperty;
  property: TagSchemaProperty<Property>;
  /**
   * this value is just for hold the `BaseValue`,
   *  don't use this value in the runtime.
   */
  __$TYPE_HOLDER$__?: BaseValue;
}

export type BlockTag<Schema extends TagSchema = TagSchema> = {
  schemaId: Schema['id'];
  value: Schema extends TagSchema<infer _, infer __, infer Value>
    ? Value
    : never;
};
