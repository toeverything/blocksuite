import type { ColumnSchema } from '@blocksuite/global/database';
import { defineBlockSchema, type SchemaToModel } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

export enum DatabaseBlockDisplayMode {
  Text,
  Grid,
  Database,
}

export const DatabaseBlockSchema = defineBlockSchema(
  'affine:database',
  internal => ({
    title: internal.Text(),
    columns: [] as ColumnSchema['id'][],
    mode: DatabaseBlockDisplayMode.Database,
    titleColumn: '',
  }),
  {
    version: 1,
    tag: literal`affine-database`,
  }
);

export type DatabaseBlockModel = SchemaToModel<typeof DatabaseBlockSchema>;
