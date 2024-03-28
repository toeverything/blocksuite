export type FieldTypeSchema = {
  Integer: number;
  FullText: string;
  String: string;
  Date: number;
};

export type FieldType = keyof FieldTypeSchema;
