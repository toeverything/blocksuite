import type { ColumnSchema } from '@blocksuite/global/database';
import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export enum DatabaseBlockDisplayMode {
  Text,
  Grid,
  Database,
}

export const DatabaseBlockModelSchema = defineBlockSchema(
  'affine:database',
  () => ({
    title: '',
    columns: [] as ColumnSchema['id'][],
    mode: DatabaseBlockDisplayMode.Database,
  }),
  {
    version: 1,
    tag: literal`affine-database`,
  }
);

export type DatabaseBlockModel = SchemaToModel<typeof DatabaseBlockModelSchema>;
